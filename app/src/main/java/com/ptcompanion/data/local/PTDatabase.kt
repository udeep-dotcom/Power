package com.ptcompanion.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.ptcompanion.data.local.dao.BodyMeasurementDao
import com.ptcompanion.data.local.dao.CheckInDao
import com.ptcompanion.data.local.dao.ClientProfileDao
import com.ptcompanion.data.local.dao.ExerciseLibraryDao
import com.ptcompanion.data.local.dao.InviteCodeDao
import com.ptcompanion.data.local.dao.ProgramDao
import com.ptcompanion.data.local.dao.SessionDao
import com.ptcompanion.data.local.dao.TrainerDao
import com.ptcompanion.data.local.entity.BodyMeasurementEntity
import com.ptcompanion.data.local.entity.CheckInEntity
import com.ptcompanion.data.local.entity.ClientProfileEntity
import com.ptcompanion.data.local.entity.ExerciseLibraryEntity
import com.ptcompanion.data.local.entity.InviteCodeEntity
import com.ptcompanion.data.local.entity.ProgramEntity
import com.ptcompanion.data.local.entity.SessionEntity
import com.ptcompanion.data.local.entity.TrainerEntity

@Database(
    entities = [
        TrainerEntity::class,
        ClientProfileEntity::class,
        InviteCodeEntity::class,
        ProgramEntity::class,
        SessionEntity::class,
        CheckInEntity::class,
        BodyMeasurementEntity::class,
        ExerciseLibraryEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class PTDatabase : RoomDatabase() {
    abstract fun trainerDao(): TrainerDao

    abstract fun clientProfileDao(): ClientProfileDao

    abstract fun inviteCodeDao(): InviteCodeDao

    abstract fun programDao(): ProgramDao

    abstract fun sessionDao(): SessionDao

    abstract fun checkInDao(): CheckInDao

    abstract fun bodyMeasurementDao(): BodyMeasurementDao

    abstract fun exerciseLibraryDao(): ExerciseLibraryDao
}
