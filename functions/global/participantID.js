export function stampParticipantData(jsPsych, inJatos) {
  if (inJatos) {
    jsPsych.data.addProperties({
      participant_id:      window.jatos.workerId,
      study_result_id:     window.jatos.studyResultId,
      prolific_pid:        window.jatos.urlQueryParameters.PROLIFIC_PID,
      prolific_study_id:   window.jatos.urlQueryParameters.STUDY_ID,
      prolific_session_id: window.jatos.urlQueryParameters.SESSION_ID,
    });
  } else {
    jsPsych.data.addProperties({
      participant_id: Math.floor(Math.random() * 900000) + 100000,
    });
  }
}
