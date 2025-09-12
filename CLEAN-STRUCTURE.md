# 🧹 Token Vibes - Clean Codebase Structure

## 📁 **Current Clean Structure**

### **Main Working Directory (Root)**
```
/Users/baileyhollabaugh/Token Vibes /
├── public/                    # Frontend files
│   ├── index.html            # Main UI (uses app-v11.js)
│   ├── app-v11.js           # Latest JavaScript with selling features
│   └── admin.html           # Admin interface
├── src/                      # Backend source code
│   ├── server.js            # Express server
│   ├── database.js          # Supabase integration
│   ├── tokenCreator.js      # Token creation logic
│   └── routes/
│       └── tokenRoutes.js   # API endpoints
├── contracts/                # Smart contracts
│   └── token-sale/          # Rust/Anchor contract for token sales
├── package.json             # Dependencies
├── vercel.json             # Vercel deployment config
└── README.md               # Project documentation
```

### **Archive Directories (Backups)**
```
├── ARCHIVE-Working-Retro-Cloud-Version/           # Backup 1
└── ARCHIVE-WORKING-RETRO-CLOUD-VERSION-WITH-SUPABASE-INTEGRATION/  # Backup 2
    ├── RESTORE-INSTRUCTIONS.md                   # How to restore
    ├── ARCHIVE-WORKING-VERSION.md               # What's working
    └── [nested structure with working code]
```

## ✅ **What Was Cleaned Up**

1. **Removed duplicate `nodejs-version/`** - Was identical to root but missing smart contracts
2. **Removed `browser-version/`** - Not being used, just added confusion
3. **Removed old JavaScript files** - Kept only `app-v11.js` (the one being used)
4. **Preserved all archive directories** - Your working backups are safe

## 🎯 **Current Status**

- **Root directory**: Contains the latest working code with selling features
- **Vercel deployment**: Points to root directory (`src/server.js`)
- **Smart contracts**: Located in `contracts/token-sale/`
- **Backups**: Two archive directories preserved for safety

## 🚀 **Next Steps**

1. **Test deployment** - Verify Vercel still works
2. **Code optimization** - Remove any remaining AI slop
3. **Documentation** - Update README with current features

---
**Last Cleaned**: September 12, 2025  
**Status**: Clean and organized ✅
