const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const app = express();

// 加载 .env 文件
require('dotenv').config({ path: path.join(__dirname, '.env')}); 
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);

// 中间件
app.use(cors({
	origin: 'https://www.chateau-corneille.fr'  // 替换为 OVHcloud 域名
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置Nodemailer使用Orange SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
	logger: true, // 启用日志
	debug: true // 启用调试
});

// 处理预订请求
app.post('/api/book', async (req, res) => {
	const requestTime = new Date().toISOString(); // UTC 时间戳
    console.log(`Request received at ${requestTime}`);
	console.log('Content-Type:', req.headers['content-type']);
	console.log('Received body:', req.body); // 调试日志
	console.log('Raw body:', req.body); // 调试原始 body
    const { name, date, time, guests, phone, email, message } = req.body || {};

    // 验证数据
       if (!req.body ||!name || !date || !time || !guests || !phone|| !email|| !message) {
           return res.status(400).json({ error: 'Tous les champs sont obligatoires./ All fields are required' });
       }

    // 基本格式验证
       const phoneRegex = /^0[1-9][0-9]{8}$/; // 法国10位电话号码
       if (!phoneRegex.test(phone)) {
           return res.status(400).json({ error: 'Numéro de téléphone invalide (10 chiffres commençant par 0)./phone number invalide (10-digit starting with 0).' });
       }
    
	try {
    // 动态生成邮件内容
       const mailOptions = {
           from: process.env.EMAIL_USER,
           to: 'chateau-corneille@orange.fr',
           subject: 'Nouvelle Demande de Réservation',
           text: `
               Nouvelle demande :
               Nom : ${name}
               Date : ${date}
               Heure : ${time}
               Nombre de personnes : ${guests}
               Phone : ${phone}
               Email du client : ${email}
               Message : ${message}
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
                   <li><strong>Message :</strong> ${message}</li>
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