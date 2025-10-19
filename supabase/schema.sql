-- Supabase Schema for Project Afterglow
-- Cloud storage for SANITIZED data only
--
-- IMPORTANT: This schema is designed for sanitized data.
-- All PII must be removed before data reaches this layer.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (via Supabase Auth)
-- No custom users table needed - using Supabase Auth

-- ============================================================================
-- Datasets
-- ============================================================================

CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tinder', 'hinge')),
  parser_version TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  match_count INTEGER NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 0,
  earliest_message TIMESTAMPTZ,
  latest_message TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for datasets
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_datasets_platform ON datasets(platform);
CREATE INDEX idx_datasets_imported_at ON datasets(imported_at DESC);

-- RLS policies for datasets
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own datasets"
  ON datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Participants (SANITIZED)
-- ============================================================================

CREATE TABLE participants (
  id TEXT NOT NULL,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tinder', 'hinge')),
  -- PII fields are NOT stored
  -- name, location removed
  age INTEGER,
  gender_label TEXT,
  is_user BOOLEAN NOT NULL,
  traits JSONB, -- Array of sanitized traits
  prompts JSONB, -- Array of {title, response} with sanitized content
  attributes JSONB, -- Custom attributes from unknown fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dataset_id, id)
);

-- Indexes for participants
CREATE INDEX idx_participants_dataset_id ON participants(dataset_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_platform ON participants(platform);
CREATE INDEX idx_participants_is_user ON participants(is_user);

-- RLS policies for participants
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participants"
  ON participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participants"
  ON participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participants"
  ON participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participants"
  ON participants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Matches (SANITIZED)
-- ============================================================================

CREATE TABLE matches (
  id TEXT NOT NULL,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tinder', 'hinge')),
  created_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  origin TEXT, -- e.g., "like", "super-like", "boost"
  status TEXT NOT NULL CHECK (status IN ('active', 'closed', 'unmatched', 'expired')),
  participants JSONB NOT NULL, -- Array of participant IDs
  attributes JSONB, -- Platform-specific attributes
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dataset_id, id)
);

-- Indexes for matches
CREATE INDEX idx_matches_dataset_id ON matches(dataset_id);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_platform ON matches(platform);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

-- RLS policies for matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
  ON matches FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Messages (SANITIZED)
-- ============================================================================

CREATE TABLE messages (
  id TEXT NOT NULL,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  body TEXT NOT NULL, -- SANITIZED message content
  direction TEXT NOT NULL CHECK (direction IN ('user', 'match')),
  delivery TEXT CHECK (delivery IN ('sent', 'delivered', 'read', 'unknown')),
  prompt_context JSONB, -- {title, response} for prompt-based messages
  reactions JSONB, -- Array of {emoji, actorId, sentAt}
  attachments JSONB, -- Array of {type, url?}
  attributes JSONB, -- Custom attributes from unknown fields
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dataset_id, id)
);

-- Indexes for messages
CREATE INDEX idx_messages_dataset_id ON messages(dataset_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_direction ON messages(direction);

-- RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- User Preferences
-- ============================================================================

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT CHECK (theme IN ('light', 'dark')),
  privacy_mode BOOLEAN NOT NULL DEFAULT true,
  telemetry_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies for user preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for datasets
CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Data Retention Policy (Auto-delete old data after 90 days)
-- ============================================================================

-- Function to delete old datasets
CREATE OR REPLACE FUNCTION delete_old_datasets()
RETURNS void AS $$
BEGIN
  DELETE FROM datasets
  WHERE imported_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Schedule this function to run daily using pg_cron or Supabase Edge Functions

-- ============================================================================
-- Helpful Views
-- ============================================================================

-- View for user statistics
CREATE OR REPLACE VIEW user_dataset_stats AS
SELECT
  d.user_id,
  d.id as dataset_id,
  d.platform,
  d.message_count,
  d.match_count,
  d.participant_count,
  d.earliest_message,
  d.latest_message,
  d.imported_at,
  COUNT(DISTINCT m.id) as stored_message_count,
  COUNT(DISTINCT ma.id) as stored_match_count
FROM datasets d
LEFT JOIN messages m ON m.dataset_id = d.id
LEFT JOIN matches ma ON ma.dataset_id = d.id
GROUP BY d.user_id, d.id, d.platform, d.message_count, d.match_count,
         d.participant_count, d.earliest_message, d.latest_message, d.imported_at;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE datasets IS 'Metadata about imported dating app datasets';
COMMENT ON TABLE participants IS 'Sanitized participant profiles (all PII removed)';
COMMENT ON TABLE matches IS 'Sanitized match/connection data';
COMMENT ON TABLE messages IS 'Sanitized message data (all PII removed from body)';
COMMENT ON TABLE user_preferences IS 'User application preferences';

COMMENT ON COLUMN participants.traits IS 'Sanitized traits like job titles, schools (generic placeholders only)';
COMMENT ON COLUMN messages.body IS 'SANITIZED message content - all PII must be removed before storage';
