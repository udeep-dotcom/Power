package com.ptcompanion.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.ptcompanion.domain.model.ComplianceStatus
import com.ptcompanion.ui.theme.ComplianceNeedsAttention
import com.ptcompanion.ui.theme.ComplianceNoData
import com.ptcompanion.ui.theme.ComplianceOnTrack

private fun ComplianceStatus.color(): Color = when (this) {
    ComplianceStatus.ON_TRACK -> ComplianceOnTrack
    ComplianceStatus.NEEDS_ATTENTION -> ComplianceNeedsAttention
    ComplianceStatus.NO_DATA -> ComplianceNoData
}

private fun ComplianceStatus.label(): String = when (this) {
    ComplianceStatus.ON_TRACK -> "On track"
    ComplianceStatus.NEEDS_ATTENTION -> "Needs attention"
    ComplianceStatus.NO_DATA -> "No data yet"
}

/** At-a-glance dot used on the roster so a trainer never has to open a client to see status. */
@Composable
fun ComplianceDot(status: ComplianceStatus, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(10.dp)
            .background(status.color(), CircleShape),
    )
}

@Composable
fun ComplianceChip(status: ComplianceStatus, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .background(status.color().copy(alpha = 0.14f), MaterialTheme.shapes.extraLarge)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = status.label(),
            style = MaterialTheme.typography.labelMedium,
            color = status.color(),
        )
    }
}
