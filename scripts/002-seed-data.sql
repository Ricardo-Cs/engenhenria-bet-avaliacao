-- Insert admin user (password: admin123)
INSERT INTO users (email, password, role, balance) VALUES 
('admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9u2', 'admin', 10000.00);

-- Insert regular users (password: user123)
INSERT INTO users (email, password, role, balance) VALUES 
('user1@example.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 1000.00),
('user2@example.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 1500.00),
('user3@example.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 800.00);

-- Insert sample bets
INSERT INTO bets (title, description, admin_id, status, ends_at) VALUES 
('Próximo Presidente do Brasil 2026', 'Aposta sobre quem será o próximo presidente do Brasil nas eleições de 2026', 1, 'active', '2026-10-01 23:59:59'),
('Temperatura em São Paulo no Réveillon', 'Qual será a temperatura máxima em São Paulo no dia 31/12/2024?', 1, 'active', '2024-12-31 23:59:59'),
('Cor do próximo iPhone', 'Qual será a cor mais popular do próximo iPhone lançado pela Apple?', 1, 'active', '2024-09-30 23:59:59');

-- Insert bet options for the first bet (Presidential election)
INSERT INTO bet_options (bet_id, option_text, odds) VALUES 
(1, 'Lula', 2.50),
(1, 'Bolsonaro', 3.00),
(1, 'Outro candidato', 4.50);

-- Insert bet options for the second bet (Temperature)
INSERT INTO bet_options (bet_id, option_text, odds) VALUES 
(2, 'Menos de 25°C', 2.20),
(2, 'Entre 25°C e 30°C', 1.80),
(2, 'Mais de 30°C', 3.50);

-- Insert bet options for the third bet (iPhone color)
INSERT INTO bet_options (bet_id, option_text, odds) VALUES 
(3, 'Azul', 2.00),
(3, 'Preto', 1.90),
(3, 'Branco', 2.30),
(3, 'Rosa', 4.00),
(3, 'Verde', 3.20);

-- Insert some sample user bets
INSERT INTO user_bets (user_id, bet_option_id, amount, potential_payout, status) VALUES 
(2, 1, 100.00, 250.00, 'pending'),
(2, 5, 50.00, 90.00, 'pending'),
(3, 3, 200.00, 360.00, 'pending'),
(3, 8, 75.00, 150.00, 'pending'),
(4, 2, 150.00, 450.00, 'pending');
