package com.eliud.android_app.ui.theme

import androidx.compose.material3.Card
import androidx.compose.runtime.Composable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.ui.text.font.Font


@Composable
//Dashboard Screen for Rider
fun DashboardScreen(){
    Column( //Column
        modifier = Modifier
            .fillMaxSize()
            .background(RiderBackground)
            .padding(16.dp)
    ) {
        Row( //Row
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "RiderLink MX",
                color = RiderEmerald,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Modo Repa",
                color = RiderEmerald
            )
        }
        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "CDMX & Metro",
            color = RiderTextGrey
        )

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "MURO DE SOLICITUDES",
            color = RiderEmerald,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "Clientes buscando repartidores cercanos.",
            color = RiderText
        )
        Spacer(modifier = Modifier.height(16.dp))

        //Card creation
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                    containerColor = RiderSurface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Tacos 'El Guero' since 1990",
                    color = RiderText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Text(
                    text = "Negocio Local • ★ 4.9 (38)",
                    color = RiderTextGrey
                )
                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Se buscan 2 repartidores fijos para turnos por la tarde",
                    color = RiderAmber,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Necesitamos entregas continuas de 14:00 a 19:00. Pagos inmediatos en efectivo",
                    color = RiderText
                )
                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "$$ Pago inmediato",
                    color = RiderTextGrey
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Ofrece / Presupuesto",
                    color = RiderTextGrey
                )
                Text(
                    text = "$90 - $120 por pedido",
                    color = RiderEmerald,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            }
        }
    }
}