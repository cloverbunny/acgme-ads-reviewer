# Quick Start Guide

## Get Running in 2 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The application will be available at: **http://localhost:3000**

---

## For Development with Auto-Reload

```bash
npm run dev
```

---

## Configuration (Optional)

### To Add Azure Integration:

1. Copy the example config:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Azure credentials:
```
AZURE_API_KEY=your-key-here
AZURE_ENDPOINT=https://your-resource.openai.azure.com/
```

3. Restart the server

---

## Using the Application

1. **Upload Files**
   - Select your ADS HTML file
   - Select your Program Requirements PDF

2. **Optional: Add Azure Key**
   - Paste your Azure API key (if you have one)
   - Paste your Azure endpoint

3. **Click "Analyze Documents"**
   - The app will check for:
     - Duplicate physician certifications
     - FTE support consistency
     - Outdated scholarly activity

4. **Review Results**
   - Click tabs to see different finding categories
   - Each finding includes severity and resolution steps

5. **Try Sample Data**
   - Click "Load Sample" to see example results

---

## Troubleshooting

**Port already in use?**
```bash
PORT=3001 npm start
```

**Need help?**
- Check `README.md` for detailed documentation
- See `DEVELOPMENT.md` for customization guide
- Check browser console (F12) for error messages

---

## Next Steps

- Customize analysis rules in `services/analyzer.js`
- Modify the UI in `public/css/styles.css`
- Add new API endpoints in `routes/`
- See `DEVELOPMENT.md` for detailed examples

Enjoy! 🚀
