# 🚨 VERCEL DEPLOYMENT ISSUES RESOLVED

## Critical Configuration Problems That Caused 20+ Failed Deployments

### 1. **Mixed Routing Properties Error** ❌
**Problem:** `vercel.json` cannot have both `"routes"` and `"headers"` properties
**Error:** Vercel rejects configuration entirely
**Solution:** Use `"rewrites"` instead of `"routes"` when using `"headers"`

```json
// ❌ WRONG - Mixed routing properties
{
  "routes": [{"src": "/(.*)", "dest": "src/server.js"}],
  "headers": [{"source": "/(.*)", "headers": [...]}]
}

// ✅ CORRECT - Use rewrites with headers
{
  "rewrites": [{"source": "/(.*)", "destination": "src/server.js"}],
  "headers": [{"source": "/(.*)", "headers": [...]}]
}
```

### 2. **Node.js Version Discontinuation** ❌
**Problem:** Vercel discontinued Node.js 18.x support
**Error:** `Node.js Version "18.x" is discontinued and must be upgraded`
**Solution:** Update to Node.js 22.x in package.json

```json
// ❌ WRONG - Discontinued version
"engines": { "node": "18.x" }

// ✅ CORRECT - Current supported version
"engines": { "node": "22.x" }
```

### 3. **Express App Export Pattern** ❌
**Problem:** Express apps must export the app, not call app.listen()
**Error:** Vercel can't handle server setup
**Solution:** Export app and only listen in development

```javascript
// ❌ WRONG - Calls app.listen()
app.listen(PORT, () => {
  console.log('Server running');
});

// ✅ CORRECT - Export for Vercel
module.exports = app;

// Only listen in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('Server running');
  });
}
```

### 4. **Static File Path Resolution** ❌
**Problem:** Wrong path when server.js is in src/ directory
**Error:** 404 errors for static files
**Solution:** Use '../public' not 'public'

```javascript
// ❌ WRONG - Looks for src/public/
app.use(express.static(path.join(__dirname, 'public')));

// ✅ CORRECT - Looks for public/
app.use(express.static(path.join(__dirname, '../public')));
```

### 5. **JSON Syntax Errors** ❌
**Problem:** vercel.json cannot have comments
**Error:** `Could not parse File as JSON: vercel.json`
**Solution:** Remove all comments from JSON files

```json
// ❌ WRONG - Comments in JSON
{
  "version": 2
}
// This comment breaks JSON parsing

// ✅ CORRECT - No comments
{
  "version": 2
}
```

### 6. **Missing Dependencies** ❌
**Problem:** @metaplex-foundation/umi package missing
**Error:** Import failures during deployment
**Solution:** Add missing dependencies to package.json

```json
// ❌ WRONG - Missing core dependency
"@metaplex-foundation/umi-bundle-defaults": "^0.9.0"

// ✅ CORRECT - Include all required packages
"@metaplex-foundation/umi": "^0.9.2",
"@metaplex-foundation/umi-bundle-defaults": "^0.9.2"
```

## 🎯 ROOT CAUSE ANALYSIS

The main issue was **configuration conflicts** that Vercel silently rejected, causing deployments to fail without clear error messages. The mixed routing properties error was the primary blocker.

## 📚 LESSONS LEARNED

1. **Always check Vercel error documentation** for configuration conflicts
2. **Test vercel.json syntax** before pushing
3. **Use current Node.js versions** (22.x minimum)
4. **Follow Express export patterns** for Vercel
5. **Validate static file paths** when moving files
6. **Never add comments to JSON** configuration files

## ✅ RESOLUTION

All issues resolved in commit `492b9160` - Token Vibes app with buying/selling features now successfully deployed to Vercel.

---
**Date:** September 12, 2025  
**Status:** RESOLVED ✅  
**Deployments:** 20+ failed attempts before success
