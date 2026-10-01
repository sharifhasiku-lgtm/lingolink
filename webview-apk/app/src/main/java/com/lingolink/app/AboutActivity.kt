package com.lingolink.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class AboutActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_about)

        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }

        val featuresContainer = findViewById<LinearLayout>(R.id.featuresContainer)
        val features = listOf(
            Triple("🎤", "Record & Translate", "Speak into your microphone and get instant transcription and translation in any supported language."),
            Triple("🎵", "Audio Upload", "Upload MP3, WAV, or M4A files and let our AI transcribe and translate them in seconds."),
            Triple("🎬", "Video Support", "Upload video files — we extract the speech and translate it, so nothing gets lost in translation."),
            Triple("🔊", "Audio Output", "Listen to the translation in your target language with natural-sounding text-to-speech."),
            Triple("📜", "Translation History", "Every translation is saved. Browse, search, and revisit your history anytime."),
            Triple("🌍", "African Languages First", "Built with East African languages in mind — Swahili, Luganda, Kikuyu, Lingala, and more.")
        )
        features.forEach { (icon, title, desc) ->
            val card = LayoutInflater.from(this).inflate(R.layout.item_feature_card, featuresContainer, false)
            card.findViewById<TextView>(R.id.tvIcon).text = icon
            card.findViewById<TextView>(R.id.tvTitle).text = title
            card.findViewById<TextView>(R.id.tvDesc).text = desc
            featuresContainer.addView(card)
        }

        val langContainer = findViewById<LinearLayout>(R.id.languagesContainer)
        val languages = listOf(
            "Swahili", "Luganda", "Kikuyu", "Luo", "Kamba", "Lingala",
            "Kinyarwanda", "Yoruba", "Igbo", "Hausa", "Zulu", "Xhosa",
            "Afrikaans", "Twi", "Somali", "Oromo", "Shona", "Nyanja",
            "English", "French", "Spanish", "German", "Arabic", "Chinese",
            "Japanese", "Korean", "Hindi", "Russian", "Portuguese", "Italian"
        )
        var row: LinearLayout? = null
        languages.forEachIndexed { index, lang ->
            if (index % 3 == 0) {
                row = LinearLayout(this).apply {
                    orientation = LinearLayout.HORIZONTAL
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply { topMargin = 12 }
                }
                langContainer.addView(row)
            }
            val chip = LayoutInflater.from(this).inflate(R.layout.item_language_chip, row, false)
            chip.findViewById<TextView>(R.id.tvChip).text = lang
            val lp = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            lp.marginEnd = 8
            chip.layoutParams = lp
            row?.addView(chip)
        }
    }
}
