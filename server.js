require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } 
});

app.post('/render', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body; // 不再接收 resolution 参数
        const base64Image = req.file.buffer.toString('base64');

        // 直接锁定 2K 专业版 ID
        const finalModelID = "nano-banana-2-2k"; 

        console.log(`>>> 正在进行 2K 深度渲染: ${finalModelID}`);

        const response = await axios.post(`${process.env.API_BASE_URL}/chat/completions`, {
            model: finalModelID,
            messages: [{
                role: "user",
                content: [
                    { 
                        type: "text", 
                        text: `Professional Architect Rendering. Requirement: High-fidelity 2K resolution. 
                               Maintain original architecture geometry strictly. 
                               Style/Context: ${prompt}.` 
                    },
                    { 
                        type: "image_url", 
                        image_url: { 
                            url: `data:${req.file.mimetype};base64,${base64Image}`,
                            detail: "high" 
                        } 
                    }
                ]
            }],
            stream: false
        }, {
            headers: { "Authorization": `Bearer ${process.env.THIRD_PARTY_KEY}` },
            timeout: 120000 
        });

        res.json({ success: true, result: response.data.choices[0].message });
        console.log(`>>> 2K 渲染任务已送达！`);
    } catch (error) {
        console.error("报错:", error.message);
        res.status(500).json({ success: false, error: "渲染失败，请检查 API 额度。" });
    }
});

app.listen(3000, () => console.log('🏗️ 建筑 AI [直出 2K 版] 后端已启动'));