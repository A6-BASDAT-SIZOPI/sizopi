import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';

interface HabitatUpdateInput {
    nama?: string;
    luas_area?: number;
    kapasitas?: number;
    status?: string;
}

interface Habitat {
    nama: string;
    luas_area: number;
    kapasitas: number;
    status: string;
}

interface Hewan {
    id: number | string;
    nama: string;
    spesies: string;
    asal_hewan: string;
    tanggal_lahir: string;
    status_kesehatan: string;
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { nama: queryNama } = req.query;

    if (!queryNama || Array.isArray(queryNama)) {
        return res.status(400).json({ message: 'Nama habitat tidak valid.' });
    }
    const habitatNama = decodeURIComponent(queryNama);


    if (req.method === 'GET') {
        try {
            const habitatResult = await pool.query(
                'SELECT nama, luas_area, kapasitas, status FROM habitat WHERE nama = $1',
                [habitatNama]
            );

            if (habitatResult.rows.length === 0) {
                return res.status(404).json({ message: `Habitat "${habitatNama}" tidak ditemukan.` });
            }
            const habitatDetail: Habitat = habitatResult.rows[0];

            const hewanResult = await pool.query(
                "SELECT id, nama, spesies, asal_hewan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') as tanggal_lahir, status_kesehatan FROM hewan WHERE nama_habitat = $1 ORDER BY nama ASC",
                [habitatNama]
            );
            const hewanInHabitat: Hewan[] = hewanResult.rows;

            res.status(200).json({ habitat: habitatDetail, animals: hewanInHabitat });

        } catch (error) {
            console.error(`Error fetching habitat detail for "${habitatNama}" (API Route):`, error);
            res.status(500).json({ message: 'Gagal mengambil detail habitat.', error: (error as Error).message });
        }
    } else if (req.method === 'PUT') {
        try {
            const { luas_area, kapasitas, status }: HabitatUpdateInput = req.body;
            const currentNama = req.body.nama;

            if (currentNama !== habitatNama) {
                return res.status(400).json({ message: "Nama habitat di URL dan body tidak cocok. Update nama habitat tidak didukung melalui endpoint ini."})
            }

            if (luas_area == null || kapasitas == null || !status) {
                return res.status(400).json({ message: 'Field yang wajib diisi kurang: luas area, kapasitas, dan status.' });
            }
            if (isNaN(luas_area) || isNaN(kapasitas)) {
                return res.status(400).json({ message: 'Luas area dan kapasitas harus berupa angka.'});
            }

            const queryText = `
                UPDATE habitat
                SET luas_area = $1, kapasitas = $2, status = $3
                WHERE nama = $4
                RETURNING nama, luas_area, kapasitas, status;
            `;
            const values = [luas_area, kapasitas, status, habitatNama];

            const result = await pool.query(queryText, values);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: `Habitat "${habitatNama}" tidak ditemukan untuk diupdate.` });
            }
            res.status(200).json(result.rows[0]);
        } catch (error: any) {
            console.error(`Error updating habitat "${habitatNama}" (API Route):`, error);
            let errorMessage = 'Gagal memperbarui data habitat.';
            if (error.code === 'P0001' && error.message) {
                errorMessage = error.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            const statusCode = error.code === 'P0001' ? 409 : 500;
            res.status(statusCode).json({ message: errorMessage });
        }
    } else if (req.method === 'DELETE') {
        try {
            const result = await pool.query('DELETE FROM habitat WHERE nama = $1 RETURNING nama', [habitatNama]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: `Habitat "${habitatNama}" tidak ditemukan untuk dihapus.` });
            }
            res.status(200).json({ message: `Habitat "${result.rows[0].nama}" berhasil dihapus.` });
        } catch (error: any) {
            console.error(`Error deleting habitat "${habitatNama}" (API Route):`, error);
            // Error 23503: foreign key violation (jika ada hewan masih di habitat ini dan ada FK constraint)
            let errorMessage = 'Gagal menghapus data habitat.';
            if (error.code === '23503') {
                errorMessage = `Gagal menghapus habitat "${habitatNama}" karena masih ada hewan di dalamnya. Pindahkan atau hapus hewan terlebih dahulu.`;
                return res.status(409).json({ message: errorMessage }); // 409 Conflict
            } else if (error.message) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}