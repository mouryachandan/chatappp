const url = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`; // 'auto/upload' हटाकर 'image/upload' लगाएं

const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET); // Upload Preset सही से यूज करें

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        const responseData = await response.json();

        if (response.status !== 200) {
            console.error('Cloudinary Upload Failed:', responseData.error);
            return null;
        }

        return responseData;
    } catch (error) {
        console.error('Upload Error:', error);
        return null;
    }
};

export default uploadFile;
