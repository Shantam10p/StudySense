CREATE TABLE study_task_completions (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    study_task_id INT NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_study_task_completions_user_task (user_id, study_task_id),
    KEY idx_study_task_completions_user_id (user_id),
    KEY idx_study_task_completions_task_id (study_task_id),
    CONSTRAINT fk_study_task_completions_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_study_task_completions_task
        FOREIGN KEY (study_task_id)
        REFERENCES study_tasks (id)
        ON DELETE CASCADE
);
