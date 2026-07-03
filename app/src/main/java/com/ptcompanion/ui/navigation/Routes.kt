package com.ptcompanion.ui.navigation

object Routes {
    const val WELCOME = "welcome"
    const val TRAINER_SIGN_UP = "trainer_sign_up"
    const val SIGN_IN = "sign_in"
    const val CLIENT_JOIN = "client_join"

    const val TRAINER_ROSTER = "trainer_roster"
    const val TRAINER_CLIENT_DETAIL = "trainer_client_detail/{clientUserId}"
    const val TRAINER_PROGRAM_BUILDER = "trainer_program_builder/{templateId}"
    const val NEW_TEMPLATE_ID = "new"

    fun trainerClientDetail(clientUserId: String) = "trainer_client_detail/$clientUserId"
    fun trainerProgramBuilder(templateId: String = NEW_TEMPLATE_ID) = "trainer_program_builder/$templateId"

    const val CLIENT_TODAY = "client_today"
    const val CLIENT_PROGRESS = "client_progress"
    const val CLIENT_CHECK_IN = "client_check_in"
}
