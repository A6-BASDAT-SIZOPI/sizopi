import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

// Fungsi untuk membuat trigger rotasi pelatih
async function createRotasiPelatihTrigger() {
  try {
    // Buat tabel log rotasi jika belum ada
    await query(`
      CREATE TABLE IF NOT EXISTS log_rotasi_pelatih (
        id SERIAL PRIMARY KEY,
        nama_atraksi VARCHAR(255) NOT NULL,
        pelatih_lama VARCHAR(255) NOT NULL,
        pelatih_baru VARCHAR(255) NOT NULL,
        pesan TEXT NOT NULL,
        tgl_rotasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Buat fungsi trigger untuk UPDATE
    await query(`
      CREATE OR REPLACE FUNCTION check_rotasi_pelatih_update()
      RETURNS TRIGGER AS $$
      DECLARE
        tgl_mulai TIMESTAMP;
        diff_months INTEGER;
        pelatih_baru VARCHAR(255);
        nama_pelatih_lama VARCHAR(255);
        nama_pelatih_baru VARCHAR(255);
      BEGIN
        -- Ambil tanggal mulai penugasan
        SELECT MIN(tgl_penugasan) INTO tgl_mulai
        FROM jadwal_penugasan
        WHERE nama_atraksi = NEW.nama_atraksi
        AND username_lh = NEW.username_lh;

        -- Hitung selisih bulan dengan cara yang lebih akurat
        diff_months := (
          (EXTRACT(YEAR FROM NEW.tgl_penugasan) - EXTRACT(YEAR FROM tgl_mulai)) * 12 +
          (EXTRACT(MONTH FROM NEW.tgl_penugasan) - EXTRACT(MONTH FROM tgl_mulai))
        );

        -- Jika tanggal baru lebih kecil dari tanggal lama, gunakan tanggal baru sebagai acuan
        IF NEW.tgl_penugasan < OLD.tgl_penugasan THEN
          diff_months := (
            (EXTRACT(YEAR FROM OLD.tgl_penugasan) - EXTRACT(YEAR FROM NEW.tgl_penugasan)) * 12 +
            (EXTRACT(MONTH FROM OLD.tgl_penugasan) - EXTRACT(MONTH FROM NEW.tgl_penugasan))
          );
        END IF;

        -- Jika sudah lebih dari 3 bulan
        IF diff_months >= 3 THEN
          -- Ambil nama pelatih lama
          SELECT CONCAT(nama_depan, ' ', COALESCE(nama_tengah, ''), ' ', nama_belakang) INTO nama_pelatih_lama
          FROM pengguna
          WHERE username = NEW.username_lh;

          -- Pilih pelatih baru secara random
          SELECT ph.username_lh INTO pelatih_baru
          FROM pelatih_hewan ph
          WHERE ph.username_lh != NEW.username_lh
          ORDER BY RANDOM()
          LIMIT 1;

          -- Ambil nama pelatih baru
          SELECT CONCAT(nama_depan, ' ', COALESCE(nama_tengah, ''), ' ', nama_belakang) INTO nama_pelatih_baru
          FROM pengguna
          WHERE username = pelatih_baru;

          -- Insert ke log rotasi
          INSERT INTO log_rotasi_pelatih (nama_atraksi, pelatih_lama, pelatih_baru, pesan)
          VALUES (
            NEW.nama_atraksi,
            NEW.username_lh,
            pelatih_baru,
            'SUKSES: Pelatih "' || nama_pelatih_lama || '" telah bertugas lebih dari 3 bulan di atraksi "' || 
            NEW.nama_atraksi || '" dan akan diganti oleh "' || nama_pelatih_baru || '".'
          );

          -- Update username_lh di NEW record
          NEW.username_lh := pelatih_baru;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Buat trigger untuk UPDATE
    await query(`
      DROP TRIGGER IF EXISTS trigger_rotasi_pelatih_update ON jadwal_penugasan;
      CREATE TRIGGER trigger_rotasi_pelatih_update
      BEFORE UPDATE ON jadwal_penugasan
      FOR EACH ROW
      WHEN (OLD.tgl_penugasan IS DISTINCT FROM NEW.tgl_penugasan)
      EXECUTE FUNCTION check_rotasi_pelatih_update();
    `);

    // Cek apakah trigger berhasil dibuat
    const triggerCheck = await query(`
      SELECT * FROM pg_trigger WHERE tgname = 'trigger_rotasi_pelatih_update';
    `);
    console.log('Trigger update exists:', triggerCheck.rows.length > 0);
    console.log('Trigger update details:', triggerCheck.rows[0]);

    console.log('Trigger rotasi pelatih berhasil dibuat');
  } catch (error) {
    console.error('Error creating trigger:', error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const nama_atraksi = decodeURIComponent(resolvedParams.id);

    const result = await query(`
      SELECT 
        a.nama_atraksi,
        a.lokasi,
        f.kapasitas_max,
        f.jadwal,
        jp.username_lh,
        ARRAY_AGG(DISTINCT h.id) FILTER (WHERE h.id IS NOT NULL) as hewan_terlibat
      FROM atraksi a
      JOIN fasilitas f ON a.nama_atraksi = f.nama
      LEFT JOIN jadwal_penugasan jp ON a.nama_atraksi = jp.nama_atraksi
      LEFT JOIN berpartisipasi b ON f.nama = b.nama_fasilitas
      LEFT JOIN hewan h ON b.id_hewan = h.id
      WHERE a.nama_atraksi = $1
      GROUP BY a.nama_atraksi, a.lokasi, f.kapasitas_max, f.jadwal, jp.username_lh
    `, [nama_atraksi]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Atraksi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching atraksi:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data atraksi' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const nama_atraksi = decodeURIComponent(resolvedParams.id).trim();
    const {
      lokasi,
      kapasitas_max,
      jadwal_tanggal,
      jadwal_waktu,
      pelatih,
      hewan_terlibat
    } = await request.json();

    // Pastikan trigger sudah dibuat
    await createRotasiPelatihTrigger();

    // Mulai transaksi
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let logCheck: any = null;

      // Cek apakah atraksi ada
      const atraksiCheck = await query(`
        SELECT nama_atraksi FROM atraksi WHERE TRIM(nama_atraksi) = $1
      `, [nama_atraksi]);

      console.log('Hasil pengecekan atraksi:', atraksiCheck.rows);
      console.log('Nama atraksi yang dicari:', nama_atraksi);

      if (atraksiCheck.rows.length === 0) {
        // Cek semua atraksi yang ada
        const allAtraksi = await query(`
          SELECT nama_atraksi FROM atraksi
        `);
        console.log('Semua atraksi yang ada:', allAtraksi.rows);
        throw new Error(`Atraksi dengan nama "${nama_atraksi}" tidak ditemukan`);
      }

      // Cek apakah fasilitas ada
      const fasilitasCheck = await query(`
        SELECT nama FROM fasilitas WHERE TRIM(nama) = $1
      `, [nama_atraksi]);

      console.log('Hasil pengecekan fasilitas:', fasilitasCheck.rows);

      if (fasilitasCheck.rows.length === 0) {
        throw new Error(`Fasilitas dengan nama "${nama_atraksi}" tidak ditemukan`);
      }

      // Update fasilitas
      await query(
        'UPDATE fasilitas SET jadwal = $1, kapasitas_max = $2 WHERE TRIM(nama) = $3',
        [`${jadwal_tanggal}T${jadwal_waktu}:00`, kapasitas_max, nama_atraksi]
      );

      // Update atraksi
      await query(
        'UPDATE atraksi SET lokasi = $1 WHERE TRIM(nama_atraksi) = $2',
        [lokasi, nama_atraksi]
      );

      // Cek pelatih saat ini
      const currentPelatihResult = await query(`
        SELECT username_lh 
        FROM jadwal_penugasan 
        WHERE TRIM(nama_atraksi) = $1 
        ORDER BY tgl_penugasan DESC 
        LIMIT 1
      `, [nama_atraksi]);

      console.log('Hasil pengecekan pelatih saat ini:', currentPelatihResult.rows);

      const currentPelatih = currentPelatihResult.rows[0]?.username_lh;

      // Cek apakah pelatih ada
      const pelatihCheck = await query(`
        SELECT username_lh FROM pelatih_hewan WHERE username_lh = $1
      `, [pelatih]);

      console.log('Hasil pengecekan pelatih baru:', pelatihCheck.rows);

      if (pelatihCheck.rows.length === 0) {
        throw new Error(`Pelatih dengan username "${pelatih}" tidak ditemukan`);
      }

      // Jika pelatih berubah
      if (currentPelatih !== pelatih) {
        // Hapus jadwal penugasan lama
        await query(
          'DELETE FROM jadwal_penugasan WHERE TRIM(nama_atraksi) = $1 AND username_lh = $2',
          [nama_atraksi, currentPelatih]
        );

        // Insert jadwal penugasan baru dengan tanggal yang dipilih user
        const jadwalDateTime = `${jadwal_tanggal}T${jadwal_waktu}:00`;
        
        console.log('Inserting jadwal penugasan dengan tanggal:', jadwalDateTime);
        
        // Cek apakah trigger ada
        const triggerCheck = await query(`
          SELECT * FROM pg_trigger WHERE tgname = 'trigger_rotasi_pelatih_update';
        `);
        console.log('Trigger exists:', triggerCheck.rows.length > 0);

        // Insert jadwal yang akan memicu trigger
        await query(
          'INSERT INTO jadwal_penugasan (username_lh, nama_atraksi, tgl_penugasan) VALUES ($1, $2, $3)',
          [pelatih, nama_atraksi, jadwalDateTime]
        );

        // Cek log rotasi setelah insert
        logCheck = await query(`
          SELECT * FROM log_rotasi_pelatih 
          WHERE TRIM(nama_atraksi) = $1 
          ORDER BY tgl_rotasi DESC 
          LIMIT 1
        `, [nama_atraksi]);
        console.log('Log rotasi setelah insert:', logCheck.rows[0]);

      } else {
        // Update waktu penugasan jika pelatih tidak berubah
        const jadwalDateTime = `${jadwal_tanggal}T${jadwal_waktu}:00`;
        
        console.log('Updating jadwal penugasan dengan tanggal:', jadwalDateTime);
        
        // Cek apakah trigger ada
        const triggerCheck = await query(`
          SELECT * FROM pg_trigger WHERE tgname = 'trigger_rotasi_pelatih_update';
        `);
        console.log('Trigger exists:', triggerCheck.rows.length > 0);

        // Cek jadwal penugasan saat ini
        const currentJadwal = await query(`
          SELECT * FROM jadwal_penugasan 
          WHERE TRIM(nama_atraksi) = $1 AND username_lh = $2
        `, [nama_atraksi, pelatih]);
        console.log('Jadwal penugasan saat ini:', currentJadwal.rows[0]);

        // Update jadwal yang akan memicu trigger
        const updateResult = await query(
          `UPDATE jadwal_penugasan 
           SET tgl_penugasan = $1 
           WHERE TRIM(nama_atraksi) = $2 AND username_lh = $3
           RETURNING *`,
          [jadwalDateTime, nama_atraksi, pelatih]
        );
        console.log('Hasil update jadwal:', updateResult.rows[0]);

        // Cek log rotasi setelah update
        logCheck = await query(`
          SELECT * FROM log_rotasi_pelatih 
          WHERE TRIM(nama_atraksi) = $1 
          ORDER BY tgl_rotasi DESC 
          LIMIT 1
        `, [nama_atraksi]);
        console.log('Log rotasi setelah update:', logCheck.rows[0]);

        // Cek jadwal penugasan setelah update
        const updatedJadwal = await query(`
          SELECT * FROM jadwal_penugasan 
          WHERE TRIM(nama_atraksi) = $1 AND username_lh = $2
        `, [nama_atraksi, pelatih]);
        console.log('Jadwal penugasan setelah update:', updatedJadwal.rows[0]);
      }

      // Update hewan yang terlibat
      await query(
        'DELETE FROM berpartisipasi WHERE TRIM(nama_fasilitas) = $1',
        [nama_atraksi]
      );

      if (hewan_terlibat && hewan_terlibat.length > 0) {
        // Ambil nama fasilitas yang benar dari database
        const fasilitasResult = await query(`
          SELECT nama FROM fasilitas WHERE TRIM(nama) = $1
        `, [nama_atraksi]);

        if (fasilitasResult.rows.length === 0) {
          throw new Error(`Fasilitas dengan nama "${nama_atraksi}" tidak ditemukan`);
        }

        const namaFasilitasBenar = fasilitasResult.rows[0].nama;
        console.log('Nama fasilitas yang benar:', namaFasilitasBenar);

        // Gunakan nama fasilitas yang benar untuk insert
        const values = hewan_terlibat.map((id_hewan: string) => 
          `('${namaFasilitasBenar}', '${id_hewan}')`
        ).join(',');

        console.log('Query insert berpartisipasi:', `INSERT INTO berpartisipasi (nama_fasilitas, id_hewan) VALUES ${values}`);

        await query(
          `INSERT INTO berpartisipasi (nama_fasilitas, id_hewan) VALUES ${values}`
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ 
        message: 'Atraksi berhasil diupdate',
        rotasiMessage: logCheck?.rows[0]?.pesan
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating atraksi:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Gagal mengupdate atraksi' },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating atraksi:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate atraksi' },
      { status: 500 }
    );
  }
} 