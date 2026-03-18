import { NextResponse } from 'next/server';
import { doc } from '../../../lib/googleSheets';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration - Stable
cloudinary.config({
  cloud_name: 'dahqse9le', 
  api_key: '294777697822393',
  api_secret: 'ZDoHWCyUBj_3rswojnzL8dJ0lsk',
});

/**
 * GET: Fetches staff list (Tab 2) AND their Training records (Tab 4)
 */
export async function GET() {
  try {
    await doc.loadInfo();
    const staffSheet = doc.sheetsByIndex[1]; // Tab 2: Staff
    const trainingSheet = doc.sheetsByIndex[3]; // Tab 4: Training

    if (!staffSheet) {
      return NextResponse.json({ error: 'Staff tab not found' }, { status: 404 });
    }

    // 1. Fetch Staff
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
      // FIX: Added 'as any[]' to prevent the 'never[]' TypeScript error
      training_records: [] as any[] 
    }));

    // 2. Fetch Training Records (if the tab exists)
    if (trainingSheet) {
      const trainingRows = await trainingSheet.getRows();
      
      // Group records by staff_id
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

      // 3. Merge training records into staff profiles
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

/**
 * POST: Handles BOTH Feedback submissions (Tab 3) and Training updates (Tab 4)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    await doc.loadInfo();

    // ==========================================
    // BRANCH 1: TRAINING UPDATE
    // ==========================================
    if (body.training_records) {
      const { staff_id, training_records } = body;
      const trainingSheet = doc.sheetsByIndex[3]; // Tab 4

      if (!trainingSheet) {
        throw new Error("Training tab (Tab 4) not found in Google Sheets");
      }

      const rows = await trainingSheet.getRows();
      const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });

      // Process each updated record from the frontend
      for (const record of training_records) {
        // Find if this specific program already exists for this staff member
        const existingRow = rows.find(
          (r: any) => String(r.get('staff_id')) === String(staff_id) && String(r.get('program_name')) === record.program_name
        );

        if (existingRow) {
          // Update existing row
          existingRow.set('status', record.status);
          existingRow.set('completion_date', record.completion_date);
          existingRow.set('timestamp', timestamp);
          await existingRow.save();
        } else {
          // Add new row if it doesn't exist
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

    // ==========================================
    // BRANCH 2: STAFF FEEDBACK (Stable Part 1 Logic)
    // ==========================================
    if (body.rating) {
      const { staff_id, name, rating, comment, photoBase64 } = body;
      let finalPhotoLink = "No Photo";

      // 1. Upload to Cloudinary
      if (photoBase64 && photoBase64.includes('base64')) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(photoBase64, {
            folder: 'aroi_staff_reviews',
            resource_type: 'auto'
          });
          finalPhotoLink = uploadResponse.secure_url;
        } catch (uploadErr: any) {
          console.error("CLOUDINARY UPLOAD ERROR:", uploadErr.message);
          return NextResponse.json({ error: `Cloudinary Error: ${uploadErr.message}` }, { status: 500 });
        }
      }

      // 2. Save record to Google Sheets
      const feedbackSheet = doc.sheetsByTitle['feedback'] || doc.sheetsByIndex[2]; // Tab 3
      
      if (!feedbackSheet) {
        throw new Error("Feedback tab (Tab 3) not found");
      }

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

    // If payload doesn't match either expected format
    return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });

  } catch (err: any) {
    console.error("POST ERROR:", err.message);
    return NextResponse.json({ error: 'Operation failed', details: err.message }, { status: 500 });
  }
}