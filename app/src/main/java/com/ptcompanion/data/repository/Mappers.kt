package com.ptcompanion.data.repository

import com.ptcompanion.data.local.SyncState
import com.ptcompanion.data.local.entity.BodyMeasurementEntity
import com.ptcompanion.data.local.entity.CheckInEntity
import com.ptcompanion.data.local.entity.ClientProfileEntity
import com.ptcompanion.data.local.entity.ExerciseLibraryEntity
import com.ptcompanion.data.local.entity.InviteCodeEntity
import com.ptcompanion.data.local.entity.ProgramEntity
import com.ptcompanion.data.local.entity.SessionEntity
import com.ptcompanion.data.local.entity.TrainerEntity
import com.ptcompanion.data.remote.dto.BodyMeasurementDto
import com.ptcompanion.data.remote.dto.CheckInDto
import com.ptcompanion.data.remote.dto.ClientProfileDto
import com.ptcompanion.data.remote.dto.ExerciseLibraryDto
import com.ptcompanion.data.remote.dto.InviteCodeDto
import com.ptcompanion.data.remote.dto.LoggedExerciseDto
import com.ptcompanion.data.remote.dto.LoggedSetDto
import com.ptcompanion.data.remote.dto.ProgramDayDto
import com.ptcompanion.data.remote.dto.ProgramDto
import com.ptcompanion.data.remote.dto.ProgramExerciseDto
import com.ptcompanion.data.remote.dto.ProgramWeekDto
import com.ptcompanion.data.remote.dto.SessionDto
import com.ptcompanion.data.remote.dto.TrainerDto
import com.ptcompanion.domain.model.BodyMeasurementEntry
import com.ptcompanion.domain.model.CheckIn
import com.ptcompanion.domain.model.ClientProfile
import com.ptcompanion.domain.model.ComplianceStatus
import com.ptcompanion.domain.model.ExerciseLibraryItem
import com.ptcompanion.domain.model.InviteCode
import com.ptcompanion.domain.model.LoggedExercise
import com.ptcompanion.domain.model.LoggedSet
import com.ptcompanion.domain.model.MuscleGroup
import com.ptcompanion.domain.model.Program
import com.ptcompanion.domain.model.ProgramDay
import com.ptcompanion.domain.model.ProgramExercise
import com.ptcompanion.domain.model.ProgramWeek
import com.ptcompanion.domain.model.SessionStatus
import com.ptcompanion.domain.model.Trainer
import com.ptcompanion.domain.model.WorkoutSession
import java.time.Instant
import java.time.LocalDate

private fun Instant.iso(): String = toString()
private fun String.toInstantOrNow(): Instant = if (isBlank()) Instant.now() else Instant.parse(this)
private fun String?.toInstantOrNull(): Instant? = this?.takeIf { it.isNotBlank() }?.let(Instant::parse)
private fun LocalDate.iso(): String = toString()
private fun String.toLocalDateOrToday(): LocalDate = if (isBlank()) LocalDate.now() else LocalDate.parse(this)

// --- Trainer -----------------------------------------------------------------------

fun TrainerDto.toDomain() = Trainer(trainerId, displayName, email, plan, createdAt.toInstantOrNow())

fun Trainer.toDto() = TrainerDto(trainerId, displayName, email, plan, createdAt.iso())

fun TrainerEntity.toDomain() = Trainer(trainerId, displayName, email, plan, createdAt)

fun Trainer.toEntity() = TrainerEntity(trainerId, displayName, email, plan, createdAt)

// --- ClientProfile -------------------------------------------------------------------

fun ClientProfileDto.toDomain() = ClientProfile(
    clientUserId = clientUserId,
    trainerId = trainerId,
    displayName = displayName,
    email = email,
    joinedAt = joinedAt.toInstantOrNow(),
    complianceStatus = ComplianceStatus.NO_DATA,
    activeProgramId = activeProgramId,
)

fun ClientProfile.toDto(redeemedInviteCode: String? = null) = ClientProfileDto(
    clientUserId = clientUserId,
    trainerId = trainerId,
    displayName = displayName,
    email = email,
    joinedAt = joinedAt.iso(),
    activeProgramId = activeProgramId,
    redeemedInviteCode = redeemedInviteCode,
)

fun ClientProfileEntity.toDomain() = ClientProfile(
    clientUserId = clientUserId,
    trainerId = trainerId,
    displayName = displayName,
    email = email,
    joinedAt = joinedAt,
    complianceStatus = ComplianceStatus.valueOf(complianceStatus),
    activeProgramId = activeProgramId,
)

fun ClientProfile.toEntity() = ClientProfileEntity(
    clientUserId = clientUserId,
    trainerId = trainerId,
    displayName = displayName,
    email = email,
    joinedAt = joinedAt,
    complianceStatus = complianceStatus.name,
    activeProgramId = activeProgramId,
)

// --- InviteCode ------------------------------------------------------------------------

fun InviteCodeDto.toDomain() = InviteCode(
    code = code,
    trainerId = trainerId,
    clientDisplayName = clientDisplayName,
    createdAt = createdAt.toInstantOrNow(),
    expiresAt = expiresAt.toInstantOrNull(),
    used = used,
    usedByClientUserId = usedByClientUserId,
    usedAt = usedAt.toInstantOrNull(),
)

fun InviteCode.toDto() = InviteCodeDto(
    code = code,
    trainerId = trainerId,
    clientDisplayName = clientDisplayName,
    createdAt = createdAt.iso(),
    expiresAt = expiresAt?.iso(),
    used = used,
    usedByClientUserId = usedByClientUserId,
    usedAt = usedAt?.iso(),
)

fun InviteCodeEntity.toDomain() = InviteCode(
    code = code,
    trainerId = trainerId,
    clientDisplayName = clientDisplayName,
    createdAt = createdAt,
    expiresAt = expiresAt,
    used = used,
    usedByClientUserId = usedByClientUserId,
    usedAt = usedAt,
)

fun InviteCode.toEntity() = InviteCodeEntity(
    code = code,
    trainerId = trainerId,
    clientDisplayName = clientDisplayName,
    createdAt = createdAt,
    expiresAt = expiresAt,
    used = used,
    usedByClientUserId = usedByClientUserId,
    usedAt = usedAt,
)

// --- Program -----------------------------------------------------------------------

fun ProgramExerciseDto.toDomain() = ProgramExercise(
    exerciseId, exerciseName, orderIndex, sets, reps, targetWeightKg, targetRpe,
    restSeconds?.toInt(), coachingNote,
)

fun ProgramExercise.toDto() = ProgramExerciseDto(
    exerciseId, exerciseName, orderIndex, sets, reps, targetWeightKg, targetRpe,
    restSeconds?.toLong(), coachingNote,
)

fun ProgramDayDto.toDomain() = ProgramDay(dayId, index, label, exercises.map { it.toDomain() })

fun ProgramDay.toDto() = ProgramDayDto(dayId, index, label, exercises.map { it.toDto() })

fun ProgramWeekDto.toDomain() = ProgramWeek(weekId, index, days.map { it.toDomain() })

fun ProgramWeek.toDto() = ProgramWeekDto(weekId, index, days.map { it.toDto() })

fun ProgramDto.toDomain() = Program(
    programId = programId,
    trainerId = trainerId,
    name = name,
    isTemplate = isTemplate,
    clientUserId = clientUserId,
    clonedFromTemplateId = clonedFromTemplateId,
    weeks = weeks.map { it.toDomain() },
    createdAt = createdAt.toInstantOrNow(),
    updatedAt = updatedAt.toInstantOrNow(),
)

fun Program.toDto() = ProgramDto(
    programId = programId,
    trainerId = trainerId,
    name = name,
    isTemplate = isTemplate,
    clientUserId = clientUserId,
    clonedFromTemplateId = clonedFromTemplateId,
    weeks = weeks.map { it.toDto() },
    createdAt = createdAt.iso(),
    updatedAt = updatedAt.iso(),
)

fun ProgramEntity.toDomain() = Program(
    programId = programId,
    trainerId = trainerId,
    name = name,
    isTemplate = isTemplate,
    clientUserId = clientUserId,
    clonedFromTemplateId = clonedFromTemplateId,
    weeks = weeks,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun Program.toEntity() = ProgramEntity(
    programId = programId,
    trainerId = trainerId,
    name = name,
    isTemplate = isTemplate,
    clientUserId = clientUserId,
    clonedFromTemplateId = clonedFromTemplateId,
    weeks = weeks,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

// --- WorkoutSession ------------------------------------------------------------------

fun LoggedSetDto.toDomain() = LoggedSet(setIndex, targetReps, actualReps?.toInt(), actualWeightKg, rpe, completed)

fun LoggedSet.toDto() = LoggedSetDto(setIndex, targetReps, actualReps?.toLong(), actualWeightKg, rpe, completed)

fun LoggedExerciseDto.toDomain() = LoggedExercise(exerciseId, exerciseName, orderIndex, sets.map { it.toDomain() })

fun LoggedExercise.toDto() = LoggedExerciseDto(exerciseId, exerciseName, orderIndex, sets.map { it.toDto() })

fun SessionDto.toDomain() = WorkoutSession(
    sessionId = sessionId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    programId = programId,
    dayId = dayId,
    dayLabel = dayLabel,
    scheduledDate = scheduledDate.toLocalDateOrToday(),
    status = runCatching { SessionStatus.valueOf(status) }.getOrDefault(SessionStatus.SCHEDULED),
    completedAt = completedAt.toInstantOrNull(),
    exercises = exercises.map { it.toDomain() },
)

fun WorkoutSession.toDto() = SessionDto(
    sessionId = sessionId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    programId = programId,
    dayId = dayId,
    dayLabel = dayLabel,
    scheduledDate = scheduledDate.iso(),
    status = status.name,
    completedAt = completedAt?.iso(),
    exercises = exercises.map { it.toDto() },
)

fun SessionEntity.toDomain() = WorkoutSession(
    sessionId = sessionId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    programId = programId,
    dayId = dayId,
    dayLabel = dayLabel,
    scheduledDate = scheduledDate,
    status = runCatching { SessionStatus.valueOf(status) }.getOrDefault(SessionStatus.SCHEDULED),
    completedAt = completedAt,
    exercises = exercises,
)

fun WorkoutSession.toEntity(syncState: SyncState) = SessionEntity(
    sessionId = sessionId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    programId = programId,
    dayId = dayId,
    dayLabel = dayLabel,
    scheduledDate = scheduledDate,
    status = status.name,
    completedAt = completedAt,
    exercises = exercises,
    syncState = syncState.name,
    updatedAt = Instant.now(),
)

// --- CheckIn -----------------------------------------------------------------------

fun CheckInDto.toDomain() = CheckIn(
    checkInId = checkInId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    weekOf = weekOf.toLocalDateOrToday(),
    energyLevel = energyLevel.toInt(),
    sorenessLevel = sorenessLevel.toInt(),
    stickingToPlan = stickingToPlan,
    note = note,
    submittedAt = submittedAt.toInstantOrNow(),
)

fun CheckIn.toDto() = CheckInDto(
    checkInId = checkInId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    weekOf = weekOf.iso(),
    energyLevel = energyLevel.toLong(),
    sorenessLevel = sorenessLevel.toLong(),
    stickingToPlan = stickingToPlan,
    note = note,
    submittedAt = submittedAt.iso(),
)

fun CheckInEntity.toDomain() = CheckIn(
    checkInId = checkInId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    weekOf = weekOf,
    energyLevel = energyLevel,
    sorenessLevel = sorenessLevel,
    stickingToPlan = stickingToPlan,
    note = note,
    submittedAt = submittedAt,
)

fun CheckIn.toEntity(syncState: SyncState) = CheckInEntity(
    checkInId = checkInId,
    trainerId = trainerId,
    clientUserId = clientUserId,
    weekOf = weekOf,
    energyLevel = energyLevel,
    sorenessLevel = sorenessLevel,
    stickingToPlan = stickingToPlan,
    note = note,
    submittedAt = submittedAt,
    syncState = syncState.name,
)

// --- BodyMeasurement -----------------------------------------------------------------

fun BodyMeasurementDto.toDomain() = BodyMeasurementEntry(entryId, trainerId, clientUserId, date.toLocalDateOrToday(), weightKg, note)

fun BodyMeasurementEntry.toDto() = BodyMeasurementDto(entryId, trainerId, clientUserId, date.iso(), weightKg, note)

fun BodyMeasurementEntity.toDomain() = BodyMeasurementEntry(entryId, trainerId, clientUserId, date, weightKg, note)

fun BodyMeasurementEntry.toEntity(syncState: SyncState) =
    BodyMeasurementEntity(entryId, trainerId, clientUserId, date, weightKg, note, syncState.name)

// --- ExerciseLibrary -----------------------------------------------------------------

fun ExerciseLibraryDto.toDomain() = ExerciseLibraryItem(
    exerciseId, name, runCatching { MuscleGroup.valueOf(muscleGroup) }.getOrDefault(MuscleGroup.FULL_BODY), equipment,
)

fun ExerciseLibraryEntity.toDomain() = ExerciseLibraryItem(
    exerciseId, name, runCatching { MuscleGroup.valueOf(muscleGroup) }.getOrDefault(MuscleGroup.FULL_BODY), equipment,
)

fun ExerciseLibraryItem.toEntity() = ExerciseLibraryEntity(exerciseId, name, muscleGroup.name, equipment)
