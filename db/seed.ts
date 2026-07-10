import { getDb } from "../api/queries/connection";
import { departments } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding departments...");

  const depts = [
    { name: "Dokter Umum", code: "DOK_UMUM", description: "Bagian dokter umum" },
    { name: "Dokter Spesialis", code: "DOK_SPES", description: "Bagian dokter spesialis" },
    { name: "Perawat", code: "PERAWAT", description: "Bagian perawat" },
    { name: "Farmasi", code: "FARMASI", description: "Bagian farmasi dan apotek" },
    { name: "Laboratorium", code: "LAB", description: "Bagian laboratorium" },
    { name: "Radiologi", code: "RAD", description: "Bagian radiologi" },
    { name: "Administrasi", code: "ADMIN", description: "Bagian administrasi dan rekam medis" },
    { name: "Gizi", code: "GIZI", description: "Bagian gizi dan nutrisi" },
    { name: "Rehabilitasi Medis", code: "REHAB", description: "Bagian rehabilitasi medis" },
    { name: "Ambulans", code: "AMBULANS", description: "Bagian ambulans dan gawat darurat" },
    { name: "Kebersihan", code: "KB", description: "Bagian kebersihan dan sanitasi" },
    { name: "Security", code: "SEC", description: "Bagian keamanan" },
    { name: "IT", code: "IT", description: "Bagian teknologi informasi" },
    { name: "HRD", code: "HRD", description: "Bagian sumber daya manusia" },
  ];

  for (const dept of depts) {
    await db.insert(departments).values(dept).onDuplicateKeyUpdate({
      set: { name: dept.name, description: dept.description },
    });
  }

  console.log("Seeded departments successfully!");
}

seed().catch(console.error);
