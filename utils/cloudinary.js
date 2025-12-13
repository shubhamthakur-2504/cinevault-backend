import { v2 as cloudinary } from "cloudinary";
import fs from 'fs/promises'
import path from "path";
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from "../config/const.js";

// Configuration
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});


export const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== "string") return null;

  const isCloudinary = url.includes("res.cloudinary.com");
  if (!isCloudinary) return null; 

  try {
    const parsedUrl = new URL(url);
    const parts = parsedUrl.pathname.split("/");

    const uploadIndex = parts.findIndex((p) => p === "upload");
    if (uploadIndex === -1) return null;

    let rest = parts.slice(uploadIndex + 1);

    if (rest.length && /^v\d+$/.test(rest[0])) {
      rest = rest.slice(1);
    }

    const fullPath = rest.join("/");

    const publicId = fullPath.replace(path.extname(fullPath), "");

    return publicId || null;

  } catch (err) {
    console.warn("Failed to extract Cloudinary public_id:", err);
    return null;
  }
};


const uploadOnCloudinary = async function (localFilePath) {
    try {
        console.log(localFilePath);

        if (!localFilePath) {
            console.log("File not found");  
            return null
        }

        let resourceType = 'image';
        let folder = 'cinevault/images';
        console.log("uploading");

        const res = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: resourceType,
            folder: folder
        })

        console.log("File uploaded on Cloudinary. File Src : " + res.secure_url);
        if (res && res.secure_url) {
            try {
                await fs.unlink(localFilePath);
            } catch (err) {
                console.error("Error deleting local file:", err);
            }
        }
        res.url = res.secure_url;
        return res

    } catch (error) {
        console.log("Cloudinary upload error::", error); 
        return null
    }
}

const deleteFromCloudinary = async function (filePath, fileType = 'image') {
    try {
        if (!filePath) {
            console.log("File not found");
            return null
        }

        const publicId = extractCloudinaryPublicId(filePath);
        if (!publicId) {
            return null
        }
        
        const deleteResponse = await cloudinary.uploader.destroy(publicId, {
            resource_type: fileType
        });

        return deleteResponse

    } catch (error) {
        console.log("Cloudinary delete error::", error); 
        return null
    }
}


export { uploadOnCloudinary, deleteFromCloudinary};