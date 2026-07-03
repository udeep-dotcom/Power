# Firestore model classes are (de)serialized via reflection; keep fields and no-arg constructors.
-keepclassmembers class com.ptcompanion.data.remote.dto.** {
    *;
}
-keep class com.ptcompanion.data.remote.dto.** { *; }
