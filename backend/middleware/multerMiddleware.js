const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'training_images');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
     const rawName = req.query.name || "unknown";
    const personName = rawName.trim().replace(/\s+/g, "_");
    req.cleanedName = personName;
     console.log(personName,"upload images ")
    if (!personName) return cb(new Error('Person name is required'), null);

    const personDir = path.join(baseDir, personName);

    // Create folder if it doesn't exist
    if (!fs.existsSync(personDir)) {
      fs.mkdirSync(personDir, { recursive: true });
    }

    cb(null, personDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const personName =  req.cleanedName;
    const personId = req.user.id;

    // Add timestamp + random number so filenames don't collide
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(null, `${personName}_${personId}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  // limits: { fileSize: 2 * 1024 * 1024 } // Optional: 2MB per file limit
});

module.exports = upload;
