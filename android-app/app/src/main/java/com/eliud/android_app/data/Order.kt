package com.eliud.android_app.data

data class Order(
    val id: Int,
    val client_id: Int,
    val description: String,
    val pickup: String,
    val delivery: String,
    val reward: Double,
    val comments: String?,
    var status: String,
    val driver_id: Int?
)
