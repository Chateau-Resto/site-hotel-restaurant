const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const app = express();

// 加载 .env 文件
require('dotenv').config({ path: path.join(__dirname, '.env')}); 

// 中间件
app.use(cors({
	origin: 'https://www.chateau-corneille.fr'  // 替换为 OVHcloud 域名
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置Nodemailer使用 OVH SMTP
const transporter = nodemailer.createTransport({
    host: process.env.OVH_HOST,
    port: process.env.OVH_PORT,
    secure: true, // 端口是 465
    auth: {
        user: process.env.OVH_USER,
        pass: process.env.OVH_PASS
    },
    // 保留你之前设置的超时选项
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    maxRetries: 2,
    retryDelay: 5000
});

// 处理预订请求
app.post('/api/book', async (req, res) => {
	const requestTime = new Date().toISOString(); // UTC 时间戳
    console.log(`Request received at ${requestTime}`);
	console.log('Content-Type:', req.headers['content-type']);
	console.log('Received body:', req.body); // 调试日志
	console.log('Raw body:', req.body); // 调试原始 body
    const { name, date, time, guests, phone, email, message } = req.body || {};

    // 验证数据 only required fields except message
       if (!req.body ||!name || !date || !time || !guests || !phone|| !email) {
           return res.status(400).json({ error: 'Tous les champs sont obligatoires sauf le message./ All fields are required except message' });
       }

    // 基本格式验证
	   const phoneRegex = /^(\+([1-9][0-9]{0,2})[-. ]?)?[0-9]{6,14}$/;
       if (!phone || !phoneRegex.test(phone)) {
       return res.status(400).json({ error: 'Numéro de téléphone invalide. Utilisez un format comme +33123456789 ou 0123456789./phone number invalide. Use format like +33123456789 or 0123456789 ' });
    }
    
	try {
    // 动态生成邮件内容
       const mailOptions = {
           from: '"Booking Restaurant La Closerie" <reservation@chateau-corneille.fr>',  
           to: 'contact@chateau-corneille.fr', 
           subject: 'Nouvelle Demande de Réservation',
           text: `
               Nouvelle demande :
               Nom : ${name}
               Date : ${date}
               Heure : ${time}
               Nombre de personnes : ${guests}
               Phone : ${phone}
               Email du client : ${email}
               Message : ${message || 'Aucun message / No message'}
           `,
           html: `
               <h2>Nouvelle Demande de Réservation</h2>
               <p> Nouvelle demande :</p>
               <ul>
                   <li><strong>Nom du client :</strong> ${name}</li>
                   <li><strong>Date :</strong> ${date}</li>
                   <li><strong>Heure :</strong> ${time}</li>
                   <li><strong>Nombre de personnes :</strong> ${guests}</li>
                   <li><strong>Phone :</strong> ${phone}</li>
                   <li><strong>Email du client :</strong> ${email}</li>
                   <li><strong>Message :</strong> ${message || 'Aucun message / No message'}</li>
               </ul>
           `
       };

        await transporter.sendMail(mailOptions);
		console.log('Email sent successfully');
        res.status(200).json({ message: 'Réservation réussie ! Nous vous contacterons par email pour confirmation./Booking successful! We will contact you by email for confirmation.' });
    } catch (error) {
        console.error('Échec de l’envoi de l’e-mail:', error);
        res.status(500).json({ error: 'Échec de l’envoi de l’e-mail. Veuillez réessayer plus tard./Submission failed. Please try again later.' });
    }
});

// 健康检查端点
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// 启动服务器
const PORT = process.env.PORT;
if (!PORT) {
    console.error('PORT environment variable not set by Render');
    process.exit(1);
}
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});