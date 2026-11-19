package com.eliud.android_app.ui.theme

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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.lazy.LazyColumn

/* Request Card*/
@Composable
fun RequestCard(
    name: String,
    info: String,
    title: String,
    description: String,
    tags: String,
    offer: String
){
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = RiderSurface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = name,
                color = RiderText,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
            Text(
                text = info,
                color = RiderTextGrey
            )
            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = title,
                color = RiderAmber,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = description,
                color = RiderText
            )
            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = tags,
                color = RiderTextGrey
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Ofrece / Presupuesto",
                color = RiderTextGrey
            )
            Text(
                text = offer,
                color = RiderEmerald,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ){
                OutlinedButton(
                    onClick = { /*TODO: Contraoferta*/ },
                    modifier = Modifier.weight(1f),
                    border = BorderStroke(1.dp, RiderEmerald)
                ){
                    Text(
                        text = "Contraoferta",
                        color = RiderEmerald
                    )

                }
                Button(
                    onClick = {/*TODO: Postularme */},
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = RiderEmerald
                    )
                ) {
                    Text(
                        text = "Postularme",
                        color = RiderBackground,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
@Composable
//Dashboard Screen for Rider
fun DashboardScreen(){
    LazyColumn ( //Column
        modifier = Modifier
            .fillMaxSize()
            .background(RiderBackground)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
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
        }

        item {
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
        }

        //Card creation
        item{
            RequestCard(
                name = "Tacos 'El Guero' since 1990",
                info = "Negocio Local • ★ 4.9 (38)",
                title = "Se buscan 2 repartidores fijos para turnos por la tarde",
                description = "Necesitamos entregas continuas de 14:00 a 19:00. Pagos inmediatos en efectivo",
                tags = "# Pago Inmediato  # Cliente Frecuente  # Zona Segura",
                offer = "$90 - $120 por pedido"
            )
        }

        item{
            RequestCard(
                name = "Dra. Sofía Morales",
                info = "Cliente Particular • ★ 5.0 (14)",
                title = "Envío urgente de muestra médica a laboratorio",
                description = "Muestra delicada, entrega urgente en menos de 1 hora. Pago inmediato.",
                tags = "# Urgente  # Cliente Frecuente  # Zona Segura",
                offer = "$150 por envío"
            )
        }

    }
}

