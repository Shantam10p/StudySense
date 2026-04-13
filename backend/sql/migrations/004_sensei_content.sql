CREATE TABLE sensei_topic_content (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    topic_hash VARCHAR(64) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    concepts_json LONGTEXT NOT NULL,
    practice_json LONGTEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sensei_user_course_topic (user_id, course_id, topic_hash),
    KEY idx_sensei_user_id (user_id),
    KEY idx_sensei_course_id (course_id),
    CONSTRAINT fk_sensei_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sensei_course
        FOREIGN KEY (course_id)
        REFERENCES courses (id)
        ON DELETE CASCADE
);
