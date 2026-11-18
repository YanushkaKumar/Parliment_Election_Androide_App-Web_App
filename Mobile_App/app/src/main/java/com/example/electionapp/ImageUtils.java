package com.example.electionapp;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.widget.ImageView;

import android.view.View;

/** Decodes the base64 / data-URL images the admin app stores in Firestore. */
public final class ImageUtils {

    private ImageUtils() {}

    public static Bitmap decode(String base64) {
        if (base64 == null || base64.isEmpty()) return null;
        try {
            int comma = base64.indexOf(',');
            String payload = comma >= 0 ? base64.substring(comma + 1) : base64;
            byte[] bytes = Base64.decode(payload, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** Shows the image, or hides the view when there is none. */
    public static void bind(ImageView view, String base64) {
        Bitmap bitmap = decode(base64);
        if (bitmap != null) {
            view.setImageBitmap(bitmap);
            view.setVisibility(View.VISIBLE);
        } else {
            view.setImageDrawable(null);
            view.setVisibility(View.GONE);
        }
    }
}
