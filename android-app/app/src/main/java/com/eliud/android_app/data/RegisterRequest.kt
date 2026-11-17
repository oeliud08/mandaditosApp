package com.eliud.android_app.data

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val role: String
)
