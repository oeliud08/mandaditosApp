package com.eliud.android_app.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {
    @POST("register")
    suspend fun register(@Body request: RegisterRequest): User

    @POST("login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("orders/pending")
    suspend fun getPendingOrders(): OrdersResponse
}