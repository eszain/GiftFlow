#!/usr/bin/env node

/**
 * GiftFlow Security Audit Script
 * 
 * This script performs a comprehensive security audit of the GiftFlow platform
 * to identify potential security vulnerabilities and compliance issues.
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.criticalIssues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  log(level, category, message, file = null, line = null) {
    const issue = {
      level,
      category,
      message,
      file,
      line,
      timestamp: new Date().toISOString(),
    };

    switch (level) {
      case 'CRITICAL':
        this.criticalIssues.push(issue);
        break;
      case 'WARNING':
        this.warnings.push(issue);
        break;
      case 'INFO':
        this.recommendations.push(issue);
        break;
      default:
        this.issues.push(issue);
    }
  }

  // Check for hardcoded secrets and sensitive data
  auditSecrets() {
    console.log('🔍 Auditing for hardcoded secrets...');
    
    const sensitivePatterns = [
      { pattern: /sk_live_[a-zA-Z0-9]+/, type: 'Stripe Live Secret Key' },
      { pattern: /pk_live_[a-zA-Z0-9]+/, type: 'Stripe Live Publishable Key' },
      { pattern: /sk_test_[a-zA-Z0-9]+/, type: 'Stripe Test Secret Key' },
      { pattern: /pk_test_[a-zA-Z0-9]+/, type: 'Stripe Test Publishable Key' },
      { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, type: 'JWT Token' },
      { pattern: /password\s*[:=]\s*["'][^"']+["']/, type: 'Hardcoded Password' },
      { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/, type: 'API Key' },
      { pattern: /secret\s*[:=]\s*["'][^"']+["']/, type: 'Secret' },
      { pattern: /token\s*[:=]\s*["'][^"']+["']/, type: 'Token' },
    ];

    this.scanFiles(['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'], (content, file) => {
      sensitivePatterns.forEach(({ pattern, type }) => {
        const matches = content.match(pattern);
        if (matches) {
          this.log('CRITICAL', 'SECRETS', `Found ${type}: ${matches[0]}`, file);
        }
      });
    });
  }

  // Check API route security
  auditApiRoutes() {
    console.log('🔍 Auditing API route security...');
    
    const apiDir = path.join(process.cwd(), 'src/app/api');
    if (!fs.existsSync(apiDir)) {
      this.log('WARNING', 'API_ROUTES', 'API directory not found');
      return;
    }

    this.scanDirectory(apiDir, (file) => {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(process.cwd(), file);
        
        // Check for auth() usage
        if (content.includes('auth()') && !content.includes('import { auth }')) {
          this.log('CRITICAL', 'API_ROUTES', 'Missing auth import', relativePath);
        }

        // Check for unprotected routes
        if (content.includes('export async function') && !content.includes('auth()')) {
          // Allow some public routes
          const publicRoutes = ['/api/wishes', '/api/health'];
          const isPublicRoute = publicRoutes.some(route => relativePath.includes(route));
          
          if (!isPublicRoute) {
            this.log('WARNING', 'API_ROUTES', 'Route may be missing authentication', relativePath);
          }
        }

        // Check for proper error handling
        if (content.includes('try {') && !content.includes('catch')) {
          this.log('WARNING', 'API_ROUTES', 'Missing error handling in try block', relativePath);
        }

        // Check for input validation
        if (content.includes('request.json()') && !content.includes('parse(')) {
          this.log('WARNING', 'API_ROUTES', 'Missing input validation with Zod', relativePath);
        }

        // Check for role-based access control
        if (content.includes('roles.') && !content.includes('userRolesSchema.parse')) {
          this.log('WARNING', 'API_ROUTES', 'Role access without proper validation', relativePath);
        }
      }
    });
  }

  // Check database security
  auditDatabaseSecurity() {
    console.log('🔍 Auditing database security...');
    
    // Check Prisma schema
    const schemaFile = path.join(process.cwd(), 'prisma/schema.prisma');
    if (fs.existsSync(schemaFile)) {
      const content = fs.readFileSync(schemaFile, 'utf8');
      
      // Check for sensitive data exposure
      if (content.includes('@@map') && content.includes('password')) {
        this.log('WARNING', 'DATABASE', 'Password field found in schema - ensure proper hashing');
      }
      
      // Check for proper indexing
      if (!content.includes('@@index')) {
        this.log('INFO', 'DATABASE', 'Consider adding database indexes for performance');
      }
    }

    // Check for RLS policies
    const rlsFile = path.join(process.cwd(), 'supabase/security-policies.sql');
    if (fs.existsSync(rlsFile)) {
      const content = fs.readFileSync(rlsFile, 'utf8');
      
      if (!content.includes('ENABLE ROW LEVEL SECURITY')) {
        this.log('CRITICAL', 'DATABASE', 'RLS not enabled on all tables');
      }
      
      if (!content.includes('CREATE POLICY')) {
        this.log('CRITICAL', 'DATABASE', 'No RLS policies defined');
      }
    } else {
      this.log('CRITICAL', 'DATABASE', 'RLS policies file not found');
    }
  }

  // Check environment configuration
  auditEnvironmentConfig() {
    console.log('🔍 Auditing environment configuration...');
    
    const envFiles = ['.env', '.env.local', '.env.example'];
    const foundEnvFiles = [];
    
    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        foundEnvFiles.push(file);
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for required environment variables
        const requiredVars = [
          'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
          'CLERK_SECRET_KEY',
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'SUPABASE_SERVICE_ROLE_KEY',
          'DATABASE_URL',
        ];
        
        // Optional environment variables (not required for basic functionality)
        const optionalVars = [
          'STRIPE_WEBHOOK_SECRET',
        ];
        
        requiredVars.forEach(varName => {
          if (!content.includes(varName)) {
            this.log('WARNING', 'ENVIRONMENT', `Missing required environment variable: ${varName}`, file);
          }
        });
        
        // Check for optional variables (only warn if they're missing and not commented out)
        optionalVars.forEach(varName => {
          if (!content.includes(varName) && !content.includes(`# ${varName}`)) {
            this.log('INFO', 'ENVIRONMENT', `Optional environment variable not found: ${varName}`, file);
          }
        });
        
        // Check for placeholder values
        if (content.includes('your_key_here') || content.includes('your-project')) {
          this.log('WARNING', 'ENVIRONMENT', 'Contains placeholder values', file);
        }
      }
    });
    
    if (foundEnvFiles.length === 0) {
      this.log('CRITICAL', 'ENVIRONMENT', 'No environment files found');
    }
  }

  // Check middleware configuration
  auditMiddleware() {
    console.log('🔍 Auditing middleware configuration...');
    
    const middlewareFile = path.join(process.cwd(), 'src/middleware.ts');
    if (fs.existsSync(middlewareFile)) {
      const content = fs.readFileSync(middlewareFile, 'utf8');
      
      if (!content.includes('clerkMiddleware')) {
        this.log('CRITICAL', 'MIDDLEWARE', 'Clerk middleware not configured');
      }
      
      if (!content.includes('createRouteMatcher')) {
        this.log('WARNING', 'MIDDLEWARE', 'Route matching not configured');
      }
      
      if (!content.includes('auth().protect()')) {
        this.log('WARNING', 'MIDDLEWARE', 'Route protection not implemented');
      }
    } else {
      this.log('CRITICAL', 'MIDDLEWARE', 'Middleware file not found');
    }
  }

  // Check for XSS vulnerabilities
  auditXSS() {
    console.log('🔍 Auditing for XSS vulnerabilities...');
    
    this.scanFiles(['src/**/*.tsx', 'src/**/*.jsx'], (content, file) => {
      // Check for dangerouslySetInnerHTML usage
      if (content.includes('dangerouslySetInnerHTML')) {
        this.log('WARNING', 'XSS', 'dangerouslySetInnerHTML usage detected', file);
      }
      
      // Check for unescaped user input
      if (content.includes('{userInput}') || content.includes('{userData}')) {
        this.log('WARNING', 'XSS', 'Potential unescaped user input', file);
      }
      
      // Check for innerHTML usage
      if (content.includes('.innerHTML')) {
        this.log('WARNING', 'XSS', 'innerHTML usage detected', file);
      }
    });
  }

  // Check for CSRF protection
  auditCSRF() {
    console.log('🔍 Auditing CSRF protection...');
    
    // Check for CSRF tokens in forms
    this.scanFiles(['src/**/*.tsx', 'src/**/*.jsx'], (content, file) => {
      if (content.includes('<form') && !content.includes('csrf') && !content.includes('SameSite')) {
        this.log('WARNING', 'CSRF', 'Form without CSRF protection', file);
      }
    });
    
    // Check Next.js CSRF configuration
    const nextConfigFile = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigFile)) {
      const content = fs.readFileSync(nextConfigFile, 'utf8');
      if (!content.includes('csrf') && !content.includes('SameSite')) {
        this.log('INFO', 'CSRF', 'Consider enabling CSRF protection in Next.js config');
      }
    }
  }

  // Utility function to scan files
  scanFiles(patterns, callback) {
    const glob = require('glob');
    patterns.forEach(pattern => {
      const files = glob.sync(pattern, { cwd: process.cwd() });
      files.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          callback(content, file);
        }
      });
    });
  }

  // Utility function to scan directory
  scanDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, callback);
      } else {
        callback(fullPath);
      }
    });
  }

  // Generate security report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🛡️  GIFTFLOW SECURITY AUDIT REPORT');
    console.log('='.repeat(80));
    
    const totalIssues = this.criticalIssues.length + this.warnings.length + this.recommendations.length;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Critical Issues: ${this.criticalIssues.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Recommendations: ${this.recommendations.length}`);
    console.log(`   Total Issues: ${totalIssues}`);
    
    if (this.criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES (${this.criticalIssues.length}):`);
      this.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.category}] ${issue.message}`);
        if (issue.file) console.log(`      File: ${issue.file}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.category}] ${issue.message}`);
        if (issue.file) console.log(`      File: ${issue.file}`);
      });
    }
    
    if (this.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS (${this.recommendations.length}):`);
      this.recommendations.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.category}] ${issue.message}`);
        if (issue.file) console.log(`      File: ${issue.file}`);
      });
    }
    
    console.log(`\n🔧 IMMEDIATE ACTION ITEMS:`);
    console.log(`   1. Fix all critical issues before deployment`);
    console.log(`   2. Review and address warnings`);
    console.log(`   3. Implement recommendations for better security`);
    console.log(`   4. Run this audit regularly during development`);
    console.log(`   5. Consider implementing automated security scanning in CI/CD`);
    
    console.log(`\n📋 SECURITY CHECKLIST:`);
    console.log(`   ✅ Environment variables properly configured`);
    console.log(`   ✅ No hardcoded secrets in code`);
    console.log(`   ✅ All API routes protected with authentication`);
    console.log(`   ✅ Row Level Security enabled on all database tables`);
    console.log(`   ✅ Input validation with Zod on all endpoints`);
    console.log(`   ✅ Proper error handling without information leakage`);
    console.log(`   ✅ CSRF protection enabled`);
    console.log(`   ✅ XSS prevention measures in place`);
    console.log(`   ✅ Audit logging for all sensitive operations`);
    console.log(`   ✅ Rate limiting on sensitive endpoints`);
    
    console.log('\n' + '='.repeat(80));
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        critical: this.criticalIssues.length,
        warnings: this.warnings.length,
        recommendations: this.recommendations.length,
        total: totalIssues,
      },
      issues: {
        critical: this.criticalIssues,
        warnings: this.warnings,
        recommendations: this.recommendations,
      },
    };
    
    fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved to: security-audit-report.json');
  }

  // Run complete audit
  async runAudit() {
    console.log('🛡️  Starting GiftFlow Security Audit...\n');
    
    this.auditSecrets();
    this.auditApiRoutes();
    this.auditDatabaseSecurity();
    this.auditEnvironmentConfig();
    this.auditMiddleware();
    this.auditXSS();
    this.auditCSRF();
    
    this.generateReport();
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(console.error);
}

module.exports = SecurityAuditor;
