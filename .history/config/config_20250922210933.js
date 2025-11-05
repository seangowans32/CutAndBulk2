 const config = {
 env: process.env.NODE_ENV || 'development', 
 port: process.env.PORT || 3000,
 jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key", 
 mongoUri: process.env.MONGODB_URI ||"mongodb+srv://blessing:sQdJrBwpfZhj4Ulp@cluster0.cfr2y1i.mongodb.net/Skeleton?retryWrites=true&w=majority&appName=Cluster0"||
 process.env.MONGO_HOST ||
 'mongodb://' + (process.env.IP || 'localhost') + ':' + 
(process.env.MONGO_PORT || '27017') +
 '/mernproject' 
 }
 export default config
