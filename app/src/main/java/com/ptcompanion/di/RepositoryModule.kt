package com.ptcompanion.di

import com.ptcompanion.data.repository.AuthRepositoryImpl
import com.ptcompanion.data.repository.CheckInRepositoryImpl
import com.ptcompanion.data.repository.ProgramRepositoryImpl
import com.ptcompanion.data.repository.ProgressRepositoryImpl
import com.ptcompanion.data.repository.SessionRepositoryImpl
import com.ptcompanion.data.repository.TrainerRepositoryImpl
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.CheckInRepository
import com.ptcompanion.domain.repository.ProgramRepository
import com.ptcompanion.domain.repository.ProgressRepository
import com.ptcompanion.domain.repository.SessionRepository
import com.ptcompanion.domain.repository.TrainerRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindTrainerRepository(impl: TrainerRepositoryImpl): TrainerRepository

    @Binds
    @Singleton
    abstract fun bindProgramRepository(impl: ProgramRepositoryImpl): ProgramRepository

    @Binds
    @Singleton
    abstract fun bindSessionRepository(impl: SessionRepositoryImpl): SessionRepository

    @Binds
    @Singleton
    abstract fun bindProgressRepository(impl: ProgressRepositoryImpl): ProgressRepository

    @Binds
    @Singleton
    abstract fun bindCheckInRepository(impl: CheckInRepositoryImpl): CheckInRepository
}
