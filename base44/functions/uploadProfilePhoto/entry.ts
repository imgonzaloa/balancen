import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file with retries
    let fileUrl = null;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

        const result = await base44.integrations.Core.UploadFile({
          file: file,
        });

        clearTimeout(timeoutId);

        if (result?.file_url) {
          fileUrl = result.file_url;
          break;
        }
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 500ms, 1000ms, 1500ms
          await new Promise(resolve => 
            setTimeout(resolve, 500 * attempt)
          );
        }
      }
    }

    if (!fileUrl && lastError) {
      return Response.json(
        { error: 'Upload failed after retries', details: lastError.message },
        { status: 500 }
      );
    }

    // Update user profile with new photo URL
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({
      created_by: user.email
    });

    if (profiles?.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
        profile_photo: fileUrl,
        avatar_url: fileUrl,
      });
    }

    return Response.json({
      success: true,
      file_url: fileUrl,
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    console.error('[UPLOAD_PROFILE_PHOTO]', error);
    return Response.json(
      { error: 'Upload error', details: error.message },
      { status: 500 }
    );
  }
});