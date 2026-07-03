package com.ptcompanion.di

import android.content.Context
import androidx.room.Room
import com.ptcompanion.data.local.PTDatabase
import com.ptcompanion.data.local.dao.BodyMeasurementDao
import com.ptcompanion.data.local.dao.CheckInDao
import com.ptcompanion.data.local.dao.ClientProfileDao
import com.ptcompanion.data.local.dao.ExerciseLibraryDao
import com.ptcompanion.data.local.dao.InviteCodeDao
import com.ptcompanion.data.local.dao.ProgramDao
import com.ptcompanion.data.local.dao.SessionDao
import com.ptcompanion.data.local.dao.TrainerDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): PTDatabase =
        Room.databaseBuilder(context, PTDatabase::class.java, "pt-companion.db").build()

    @Provides
    fun provideTrainerDao(db: PTDatabase): TrainerDao = db.trainerDao()

    @Provides
    fun provideClientProfileDao(db: PTDatabase): ClientProfileDao = db.clientProfileDao()

    @Provides
    fun provideInviteCodeDao(db: PTDatabase): InviteCodeDao = db.inviteCodeDao()

    @Provides
    fun provideProgramDao(db: PTDatabase): ProgramDao = db.programDao()

    @Provides
    fun provideSessionDao(db: PTDatabase): SessionDao = db.sessionDao()

    @Provides
    fun provideCheckInDao(db: PTDatabase): CheckInDao = db.checkInDao()

    @Provides
    fun provideBodyMeasurementDao(db: PTDatabase): BodyMeasurementDao = db.bodyMeasurementDao()

    @Provides
    fun provideExerciseLibraryDao(db: PTDatabase): ExerciseLibraryDao = db.exerciseLibraryDao()
}
