const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

// Inisialisasi Firebase
const serviceAccount = require('../firebaseKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://penugasan-gdgoc-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

const db = admin.database();
const app = express();

// Konfigurasi CORS
const corsOptions = {
    origin: 'https://gdgoc-blacknwhite03s-projects.vercel.app',  // Ganti dengan domain frontend Anda
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Pastikan metode yang dibutuhkan diizinkan
    allowedHeaders: ['Content-Type'],  // Header yang diizinkan
    credentials: true  // Jika menggunakan cookies atau kredensial lain
};

// Gunakan middleware CORS dengan opsi
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Menangani permintaan preflight OPTIONS
app.options('*', cors(corsOptions));  // Menangani preflight request

app.get('/', (req, res) => res.send('Halo!'));
const PORT = 8000;

// create
app.post('/api/books', async (req, res) => {
    const { id, title, author, published_at } = req.body;
    if (!title || !author || !published_at) {
        return res.status(400).json({ message: 'Semua data wajib diisi' });
    }
    try {
        const ref = id ? db.ref(`books/${id}`) : db.ref('books').push();
        const newBook = {
            id: ref.key,
            title,
            author,
            published_at,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        await ref.set(newBook);
        res.status(201).json({ message: 'Buku berhasil ditambahkan', data: newBook });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat buku', error: error.message });
    }
});

// read
app.get('/api/books', async (req, res) => {
    try {
        const snapshot = await db.ref('books').once('value');
        const books = snapshot.val() || {};
        const bookList = Object.values(books);
        res.status(200).json({ data: bookList });
        console.log(bookList);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data buku', error: error.message });
    }
});

// update
app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, published_at } = req.body;
    try {
        const bookRef = db.ref(`books/${id}`);
        const snapshot = await bookRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ message: 'Buku tidak ditemukan' });
        }

        const updatedBook = {
            ...snapshot.val(),
            title: title || snapshot.val().title,
            author: author || snapshot.val().author,
            published_at: published_at || snapshot.val().published_at,
            updated_at: new Date().toISOString()
        };

        await bookRef.update(updatedBook);
        res.status(200).json({ message: 'Buku berhasil diupdate', data: updatedBook });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate buku', error: error.message });
    }
});

// delete
app.delete('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const bookRef = db.ref(`books/${id}`);
        const snapshot = await bookRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ message: 'Buku tidak ditemukan' });
        }

        await bookRef.remove();
        res.status(200).json({ message: 'Buku berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus buku', error: error.message });
    }
});

// Endpoint tidak ditemukan
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Menjalankan server di port 8000
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
