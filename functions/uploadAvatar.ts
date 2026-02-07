import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Avatar upload endpoint
 * Accepts multipart/form-data with image file
 * Returns { avatar_url }
 */
Deno.serve(async (req) => {
  try {
    // Only POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      return Response.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return Response.json(
        { error: `Invalid type: ${file.type}` },
        { status: 415 }
      );
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return Response.json(
        { error: 'File too large' },
        { status: 413 }
      );
    }

    console.log('[AVATAR] Uploading', {
      userId: user.id,
      fileName: file.name,
      type: file.type,
      sizeKb: (file.size / 1024).toFixed(1),
    });

    // Upload using Base44 integration
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });

    const uploadResult = await base44.integrations.Core.UploadFile({
      file: blob,
    });

    if (!uploadResult.file_url) {
      throw new Error('Upload failed - no URL returned');
    }

    console.log('[AVATAR] Upload success', { url: uploadResult.file_url });

    return Response.json({
      success: true,
      avatar_url: uploadResult.file_url,
    });

  } catch (error) {
    console.error('[AVATAR] Error:', error);
    return Response.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
});