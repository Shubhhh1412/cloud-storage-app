# 📦 Cloud Storage Application

A full-stack **cloud storage system** that allows users to securely
upload, manage, and sync files with version control. The application
includes authentication, file handling, and a local sync agent for
real-time updates.

------------------------------------------------------------------------


## 🚀 Features

-   🔐 **User Authentication**
    -   Signup & Login using JWT
    -   Password hashing with bcrypt
-   ☁️ **Cloud File Storage**
    -   Upload and manage files
    -   Integrated with AWS S3
-   🔄 **Real-Time File Sync**
    -   Local folder monitoring using `chokidar`
    -   Automatic sync with cloud storage
-   🗂️ **Version Control**
    -   Maintains file versions
    -   Prevents overwriting data loss
-   🌐 **Frontend Interface**
    -   Simple HTML-based UI
    -   Dashboard for file interaction

------------------------------------------------------------------------


## 🛠️ Tech Stack

### Backend

-   Node.js
-   Express.js
-   JWT Authentication
-   AWS SDK (S3)

### Frontend

-   HTML, CSS, JavaScript (Vanilla)

### Utilities & Middleware

-   Multer (file uploads)
-   Chokidar (file watching)
-   bcryptjs (password hashing)
-   dotenv (environment variables)

------------------------------------------------------------------------

## 📁 Project Structure

    cloud-storage-app/
    │
    ├── index.js
    ├── sync-agent.js
    ├── package.json
    ├── Dockerfile
    │
    ├── middleware/
    │   └── authMiddleware.js
    │
    ├── routes/
    │   └── auth.js
    │
    ├── utils/
    │   └── versionStore.js
    │
    ├── public/
    │   ├── index.html
    │   ├── login.html
    │   ├── signup.html
    │   └── dashboard.html
    │
    ├── sync-folder/
    │
    └── .env

------------------------------------------------------------------------

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

``` bash
git clone <your-repo-url>
cd cloud-storage-app
```

### 2️⃣ Install Dependencies

``` bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file:

    PORT=3000
    JWT_SECRET=your_secret_key

    AWS_ACCESS_KEY_ID=your_access_key
    AWS_SECRET_ACCESS_KEY=your_secret_key
    AWS_REGION=your_region
    AWS_BUCKET_NAME=your_bucket

------------------------------------------------------------------------

## ▶️ Running the Application

### Start the Server

``` bash
npm start
```

### Start the Sync Agent

``` bash
npm run sync
```

------------------------------------------------------------------------

## 🔄 How Sync Works

-   Monitors the `sync-folder/`
-   Detects file changes
-   Uploads and versions files automatically

------------------------------------------------------------------------

## 🔐 Authentication Flow

-   Signup → hashed password stored
-   Login → JWT token generated
-   Protected routes require token

------------------------------------------------------------------------

## 📤 File Upload Flow

-   Upload via dashboard
-   Processed using multer
-   Stored in AWS S3
-   Version tracked

------------------------------------------------------------------------

## 🧠 Version Control

-   Each update creates a new version
-   Older versions retained
-   Enables rollback

------------------------------------------------------------------------

## 🐳 Docker

### Build

``` bash
docker build -t cloud-storage-app .
```

### Run

``` bash
docker run -p 3000:3000 cloud-storage-app
```

------------------------------------------------------------------------

## 📌 API Endpoints

POST /api/auth/signup\
POST /api/auth/login

Authorization: Bearer `<token>`{=html}

------------------------------------------------------------------------

## 🔮 Future Enhancements

-   Better UI (React)
-   File search
-   Multi-user collaboration
-   Analytics dashboard

------------------------------------------------------------------------

## 👨‍💻 Author

Cloud Computing Project (Educational)

------------------------------------------------------------------------

## 📜 License

For educational use only.
