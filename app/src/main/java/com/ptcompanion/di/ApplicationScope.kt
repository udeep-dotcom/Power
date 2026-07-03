package com.ptcompanion.di

import javax.inject.Qualifier

/** A [kotlinx.coroutines.CoroutineScope] that lives as long as the process, for background sync. */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class ApplicationScope
