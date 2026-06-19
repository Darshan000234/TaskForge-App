import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {

    const allowedTypes = {
      "application/pdf": "pdf",
      "text/plain": "txt",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/jpg": "jpg",
    };

    const ext = allowedTypes[file.mimetype];

    if (!ext) {
      return reject(new Error("Only PDF, images (jpg/png), and txt files are allowed"));
    }
    const resourceType = file.mimetype.startsWith("image")
      ? "image"
      : "raw";

    const publicId = `uploads/${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream( 
      {
        resource_type: resourceType,
        public_id: publicId,
        format: ext,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};