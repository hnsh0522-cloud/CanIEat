CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE allergies (
    allergy_id SERIAL PRIMARY KEY,
    allergy_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
CREATE TABLE user_allergies (
    user_allergy_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    allergy_id INT NOT NULL REFERENCES allergies(allergy_id) ON DELETE CASCADE,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    memo TEXT,
    UNIQUE (user_id, allergy_id)
);
CREATE TABLE analysis_records (
    analysis_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('SAFE', 'CAUTION', 'UNSAFE')),
    result_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE detected_allergens (
    detected_id SERIAL PRIMARY KEY,
    analysis_id INT NOT NULL REFERENCES analysis_records(analysis_id) ON DELETE CASCADE,
    allergy_id INT REFERENCES allergies(allergy_id) ON DELETE SET NULL,
    detected_ingredient VARCHAR(100) NOT NULL,
    risk_type VARCHAR(20) CHECK (risk_type IN ('MATCH', 'SIMILAR', 'CAUTION'))
);