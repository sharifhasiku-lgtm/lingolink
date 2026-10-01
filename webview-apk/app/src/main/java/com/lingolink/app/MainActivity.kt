package com.lingolink.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var splashView: View
    private lateinit var landingView: View
    private lateinit var webContainer: FrameLayout
    private lateinit var errorView: View
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val APP_URL = "https://lingolink-wine.vercel.app"

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback == null) return@registerForActivityResult
        val uris: Array<Uri>? = when (result.resultCode) {
            Activity.RESULT_OK -> {
                val data = result.data
                if (data == null) null
                else if (data.clipData != null) {
                    val count = data.clipData!!.itemCount
                    Array(count) { i -> data.clipData!!.getItemAt(i).uri }
                } else if (data.data != null) arrayOf(data.data!!)
                else null
            }
            else -> null
        }
        filePathCallback?.onReceiveValue(uris)
        filePathCallback = null
    }

    private val micPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = FrameLayout(this)

        // Splash (native)
        splashView = layoutInflater.inflate(R.layout.activity_splash, root, false)
        root.addView(splashView, FrameLayout.LayoutParams(-1, -1))

        // Landing (native)
        landingView = layoutInflater.inflate(R.layout.activity_landing, root, false)
        landingView.visibility = View.GONE
        root.addView(landingView, FrameLayout.LayoutParams(-1, -1))

        // Web container
        webContainer = FrameLayout(this)
        webContainer.visibility = View.GONE
        webView = WebView(this)
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        progressBar.max = 100
        webContainer.addView(webView, FrameLayout.LayoutParams(-1, -1))
        webContainer.addView(progressBar, FrameLayout.LayoutParams(-1, -2, android.view.Gravity.TOP))
        root.addView(webContainer, FrameLayout.LayoutParams(-1, -1))

        // Error screen (native)
        errorView = layoutInflater.inflate(R.layout.activity_error, root, false)
        errorView.visibility = View.GONE
        root.addView(errorView, FrameLayout.LayoutParams(-1, -1))

        setContentView(root)

        // Transition splash → landing
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            splashView.visibility = View.GONE
            landingView.visibility = View.VISIBLE
        }, 1200)

        // Landing buttons
        landingView.findViewById<Button>(R.id.btnGetStarted).setOnClickListener {
            if (!isOnline()) {
                showError()
            } else {
                landingView.visibility = View.GONE
                webContainer.visibility = View.VISIBLE
                loadWebApp()
            }
        }

        landingView.findViewById<Button>(R.id.btnAbout).setOnClickListener {
            startActivity(Intent(this, AboutActivity::class.java))
        }

        landingView.findViewById<Button>(R.id.btnExit).setOnClickListener { finish() }

        errorView.findViewById<Button>(R.id.btnRetry).setOnClickListener {
            errorView.visibility = View.GONE
            landingView.visibility = View.VISIBLE
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun loadWebApp() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(false)
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString LingoLinkApp"
        }
        webView.setBackgroundColor(0xFF0F0F1E.toInt())

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("https://lingolink-wine.vercel.app") ||
                    url.startsWith("https://lingolink-backend-zur3.onrender.com")) {
                    return false
                }
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                return true
            }
            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
            }
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true) {
                    webContainer.visibility = View.GONE
                    showError()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress < 100) View.VISIBLE else View.GONE
            }
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                val intent = fileChooserParams?.createIntent()
                return try {
                    if (intent != null) fileChooserLauncher.launch(intent)
                    false
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    false
                }
            }
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }

        webView.loadUrl(APP_URL)
    }

    private fun showError() {
        webContainer.visibility = View.GONE
        errorView.visibility = View.VISIBLE
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val net = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(net) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onBackPressed() {
        when {
            webContainer.visibility == View.VISIBLE && webView.canGoBack() -> webView.goBack()
            webContainer.visibility == View.VISIBLE -> {
                webContainer.visibility = View.GONE
                landingView.visibility = View.VISIBLE
            }
            errorView.visibility == View.VISIBLE -> {
                errorView.visibility = View.GONE
                landingView.visibility = View.VISIBLE
            }
            else -> {
                @Suppress("DEPRECATION")
                super.onBackPressed()
            }
        }
    }

    override fun onDestroy() {
        if (this::webView.isInitialized) webView.destroy()
        super.onDestroy()
    }
}
