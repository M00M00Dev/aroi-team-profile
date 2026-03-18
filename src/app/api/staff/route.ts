import { NextResponse } from 'next/server';
import { doc } from '../../../lib/googleSheets';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await doc.loadInfo();
    const staffSheet = doc.sheetsByIndex[1]; // Tab 2: Staff
    const trainingSheet = doc.sheetsByIndex[3]; // Tab 4: Training

    if (!staffSheet) return NextResponse.json({ error: 'Staff tab not found' }, { status: 404 });

    const staffRows = await staffSheet.getRows();
    let staffData = staffRows.map((row: any) => ({
      staff_id: String(row.get('staff_id') || row.get('name') || Math.random()), 
      name: String(row.get('name') || ''),
      phone: String(row.get('phone') || ''),
      email: String(row.get('email') || ''),
      pay_type: String(row.get('pay_type') || ''),
      visa_status: String(row.get('visa_status') || ''),
      visa_exp: String(row.get('visa_exp') || ''),
      bank_acc: String(row.get('bank_acc') || ''),
      rate_weekday: String(row.get('rate_weekday') || '0'),
      rate_weekend: String(row.get('rate_weekend') || '0'),
      super_name: String(row.get('super_name') || ''),
      super_membership: String(row.get('super_members') || ''),
      start_date: String(row.get('start_date') || ''),
      training_step: Number(row.get('training_step') || 1),
      training_records: [] as any[] 
    }));

    if (trainingSheet) {
      const trainingRows = await trainingSheet.getRows();
      const trainingMap: Record<string, any[]> = {};
      
      trainingRows.forEach((row: any) => {
        const sId = String(row.get('staff_id'));
        if (!trainingMap[sId]) trainingMap[sId] = [];
        trainingMap[sId].push({
          program_name: String(row.get('program_name') || ''),
          status: String(row.get('status') || 'red'),
          completion_date: String(row.get('completion_date') || '')
        });
      });

      staffData = staffData.map(staff => ({
        ...staff,
        training_records: trainingMap[staff.staff_id] || []
      }));
    }

    return NextResponse.json(staffData);
  } catch (err: any) {
    console.error("GET ERROR:", err.message);
    return NextResponse.json({ error: 'Fetch failed', details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await doc.loadInfo();

    if (body.training_records) {
      const { staff_id, training_records } = body;
      const trainingSheet = doc.sheetsByIndex[3]; 

      if (!trainingSheet) throw new Error("Training tab not found");

      const rows = await trainingSheet.getRows();
      const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });

      for (const record of training_records) {
        const existingRow = rows.find(
          (r: any) => String(r.get('staff_id')) === String(staff_id) && String(r.get('program_name')) === record.program_name
        );

        if (existingRow) {
          existingRow.set('status', record.status);
          existingRow.set('completion_date', record.completion_date);
          existingRow.set('timestamp', timestamp);
          await existingRow.save();
        } else {
          await trainingSheet.addRow({
            timestamp: timestamp,
            staff_id: String(staff_id),
            program_name: record.program_name,
            status: record.status,
            completion_date: record.completion_date
          });
        }
      }
      return NextResponse.json({ success: true, type: 'training_updated' });
    }

    if (body.rating) {
      const { staff_id, name, rating, comment, photoBase64 } = body;
      let finalPhotoLink = "No Photo";

      if (photoBase64 && photoBase64.includes('base64')) {
        const uploadResponse = await cloudinary.uploader.upload(photoBase64, { folder: 'aroi_staff_reviews', resource_type: 'auto' });
        finalPhotoLink = uploadResponse.secure_url;
      }

      const feedbackSheet = doc.sheetsByIndex[2]; 
      if (!feedbackSheet) throw new Error("Feedback tab not found");

      await feedbackSheet.addRow({
        timestamp: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
        staff_id: String(staff_id),
        name: String(name),
        rating: Number(rating),
        comment: String(comment),
        photo_link: finalPhotoLink
      });

      return NextResponse.json({ success: true, type: 'feedback_saved' });
    }

    return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });

  } catch (err: any) {
    console.error("POST ERROR:", err.message);
    return NextResponse.json({ error: 'Operation failed', details: err.message }, { status: 500 });
  }
}