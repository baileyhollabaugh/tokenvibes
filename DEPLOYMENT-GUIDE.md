# 🚀 Token Vibes - Deployment Guide

## 📁 **Single Source of Truth Structure**

**NEVER create duplicate files in different directories!** Here's the correct structure:

```
Token Vibes/
├── server.js              # ← MAIN SERVER (Vercel deploys this)
├── src/
│   ├── routes/            # ← API routes
│   ├── database.js        # ← Database logic
│   └── tokenCreator.js    # ← Token creation logic
├── public/
│   ├── index.html         # ← Frontend
│   └── app-v11.js         # ← Frontend JavaScript
├── contracts/             # ← Smart contracts
├── vercel.json           # ← Vercel configuration
└── package.json          # ← Dependencies
```

## ⚠️ **CRITICAL RULES**

### **1. Only ONE server.js file**
- **Location**: Root directory (`/server.js`)
- **Purpose**: Main entry point for Vercel
- **Paths**: Uses `./src/routes/tokenRoutes` (correct paths)

### **2. Never duplicate server files**
- ❌ **DON'T**: Create `src/server.js`
- ❌ **DON'T**: Create `nodejs-version/server.js`
- ✅ **DO**: Only have root `server.js`

### **3. Vercel Configuration**
- **vercel.json** points to `server.js` (root level)
- **package.json** main points to `src/server.js` (for local dev)

## 🔧 **How to Avoid This Problem**

### **Before Making Changes:**
1. **Check vercel.json** - What file is it pointing to?
2. **Check package.json** - What's the main entry point?
3. **Only modify the files Vercel actually deploys**

### **After Cleanup:**
1. **Verify vercel.json** still points to the right file
2. **Test locally** with `npm start`
3. **Check paths** in the main server file

## 🚨 **Red Flags to Watch For**

- **Multiple server.js files** in different directories
- **vercel.json pointing to wrong file**
- **Import paths that don't match file structure**
- **Archive directories with their own server files**

## 🎯 **Current Working Configuration**

- **Vercel deploys**: `server.js` (root)
- **Local dev runs**: `src/server.js` (via package.json)
- **API routes**: `src/routes/tokenRoutes.js`
- **Frontend**: `public/index.html` + `public/app-v11.js`

## 🔄 **Deployment Process**

1. **Make changes** to the correct files
2. **Test locally**: `npm start`
3. **Commit and push** to GitHub
4. **Vercel auto-deploys** from root `server.js`
5. **Verify** at your Vercel URL

---
**Last Updated**: September 12, 2025  
**Status**: Fixed and documented ✅
