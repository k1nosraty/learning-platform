-- Phase 2: validated draft state, sealed publication and private import bindings.
CREATE TABLE learning_path (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id),
 title text NOT NULL, archived_at timestamptz, published_version_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,id)
);
CREATE TABLE path_draft (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, path_id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), canonical_json jsonb NOT NULL,
 updated_by text NOT NULL REFERENCES identity."user"(id), updated_at timestamptz NOT NULL DEFAULT now(),
 provenance_json jsonb NOT NULL DEFAULT '{}', UNIQUE(workspace_id,path_id),
 FOREIGN KEY(workspace_id,path_id) REFERENCES learning_path(workspace_id,id)
);
CREATE TABLE path_version (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, path_id uuid NOT NULL,
 version_number integer NOT NULL CHECK(version_number>0), canonical_json jsonb NOT NULL,
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'), provenance_json jsonb NOT NULL DEFAULT '{}',
 published_at timestamptz NOT NULL DEFAULT now(), published_by text NOT NULL REFERENCES identity."user"(id),
 sealed boolean NOT NULL DEFAULT false, UNIQUE(workspace_id,id), UNIQUE(workspace_id,path_id,id), UNIQUE(path_id,version_number),
 FOREIGN KEY(workspace_id,path_id) REFERENCES learning_path(workspace_id,id)
);
ALTER TABLE learning_path ADD FOREIGN KEY(workspace_id,id,published_version_id) REFERENCES path_version(workspace_id,path_id,id);
CREATE TABLE content_node (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, path_version_id uuid NOT NULL,
 logical_id text NOT NULL, parent_node_id uuid, kind text NOT NULL CHECK(kind IN ('stage','module','lesson','task','exercise','project','resource')),
 sort_order integer NOT NULL CHECK(sort_order>=0), title text NOT NULL, body_markdown text NOT NULL, resource_url text, metadata_json jsonb NOT NULL,
 UNIQUE(workspace_id,path_version_id,id), UNIQUE(path_version_id,logical_id),
 UNIQUE NULLS NOT DISTINCT(workspace_id,path_version_id,parent_node_id,sort_order),
 FOREIGN KEY(workspace_id,path_version_id) REFERENCES path_version(workspace_id,id),
 FOREIGN KEY(workspace_id,path_version_id,parent_node_id) REFERENCES content_node(workspace_id,path_version_id,id) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE completion_unit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, path_version_id uuid NOT NULL, node_id uuid NOT NULL,
 logical_id text NOT NULL, required boolean NOT NULL, rule text NOT NULL CHECK(rule IN ('self','approval')),
 UNIQUE(workspace_id,path_version_id,id), UNIQUE(path_version_id,node_id), UNIQUE(path_version_id,logical_id),
 FOREIGN KEY(workspace_id,path_version_id,node_id) REFERENCES content_node(workspace_id,path_version_id,id)
);
-- Participation identity is needed for atomic personal start; progress is Phase 3.
CREATE TABLE enrollment (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, learner_membership_id uuid NOT NULL, path_version_id uuid NOT NULL,
 origin text NOT NULL CHECK(origin IN ('personal','organization')), assigned_by uuid NOT NULL,
 manager_membership_id uuid, reviewer_membership_id uuid, due_at timestamptz, cancelled_at timestamptz,
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,id,path_version_id), UNIQUE(learner_membership_id,path_version_id),
 FOREIGN KEY(workspace_id,learner_membership_id) REFERENCES membership(workspace_id,id),
 FOREIGN KEY(workspace_id,assigned_by) REFERENCES membership(workspace_id,id),
 FOREIGN KEY(workspace_id,manager_membership_id) REFERENCES membership(workspace_id,id),
 FOREIGN KEY(workspace_id,reviewer_membership_id) REFERENCES membership(workspace_id,id),
 FOREIGN KEY(workspace_id,path_version_id) REFERENCES path_version(workspace_id,id)
);
CREATE TABLE import_run (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id), requested_by text NOT NULL REFERENCES identity."user"(id),
 method text NOT NULL CHECK(method IN ('loose','structured')), state text NOT NULL DEFAULT 'preview' CHECK(state IN ('preview','confirmed','cancelled')),
 revision integer NOT NULL DEFAULT 1, preview_json jsonb NOT NULL, source_hash text NOT NULL,
 confirmed_path_id uuid, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days',
 UNIQUE(workspace_id,id), FOREIGN KEY(workspace_id,confirmed_path_id) REFERENCES learning_path(workspace_id,id)
);
CREATE TABLE content_blob (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id),
 object_key text NOT NULL UNIQUE, original_name text NOT NULL, media_type text NOT NULL, bytes integer NOT NULL CHECK(bytes BETWEEN 0 AND 20971520), sha256 text NOT NULL,
 import_run_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,import_run_id) REFERENCES import_run(workspace_id,id)
);
CREATE TABLE import_asset (
 workspace_id uuid NOT NULL, import_run_id uuid NOT NULL, name text NOT NULL, blob_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,import_run_id,name), FOREIGN KEY(workspace_id,import_run_id) REFERENCES import_run(workspace_id,id),
 FOREIGN KEY(workspace_id,blob_id) REFERENCES content_blob(workspace_id,id)
);
CREATE TABLE draft_asset (
 workspace_id uuid NOT NULL, path_id uuid NOT NULL, name text NOT NULL, blob_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,path_id,name), FOREIGN KEY(workspace_id,path_id) REFERENCES learning_path(workspace_id,id),
 FOREIGN KEY(workspace_id,blob_id) REFERENCES content_blob(workspace_id,id)
);
CREATE TABLE version_asset (
 workspace_id uuid NOT NULL, path_version_id uuid NOT NULL, name text NOT NULL, blob_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,path_version_id,name), FOREIGN KEY(workspace_id,path_version_id) REFERENCES path_version(workspace_id,id),
 FOREIGN KEY(workspace_id,blob_id) REFERENCES content_blob(workspace_id,id)
);
CREATE INDEX ON learning_path(workspace_id,id);
CREATE TABLE outbox_event (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id),
 event_type text NOT NULL, aggregate_id uuid NOT NULL, payload_json jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), dispatched_at timestamptz, retries integer NOT NULL DEFAULT 0
);
GRANT INSERT ON outbox_event TO learning_app;
ALTER TABLE outbox_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_event FORCE ROW LEVEL SECURITY;
CREATE INDEX ON content_node(workspace_id,path_version_id,parent_node_id,sort_order);
CREATE INDEX ON enrollment(workspace_id,learner_membership_id,path_version_id);
CREATE INDEX ON import_run(workspace_id,requested_by,created_at);

CREATE FUNCTION content_editor() RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM membership WHERE workspace_id::text=current_setting('app.workspace_id',true) AND user_id=actor_id() AND status='active' AND role IN ('owner','manager'))
$$;
CREATE FUNCTION content_owner() RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM membership WHERE workspace_id::text=current_setting('app.workspace_id',true) AND user_id=actor_id() AND status='active' AND role='owner')
$$;
CREATE FUNCTION content_version_reader(v uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT content_editor() OR EXISTS(SELECT 1 FROM enrollment e JOIN membership m ON m.id IN (e.learner_membership_id,e.reviewer_membership_id) AND m.workspace_id=e.workspace_id WHERE e.workspace_id::text=current_setting('app.workspace_id',true) AND e.path_version_id=v AND m.user_id=actor_id() AND m.status='active' AND (m.id=e.learner_membership_id OR m.role IN ('owner','manager','mentor')))
$$;
REVOKE ALL ON FUNCTION content_editor(),content_owner(),content_version_reader(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION content_editor(),content_owner(),content_version_reader(uuid) TO learning_app;
CREATE POLICY content_event_enqueue ON outbox_event FOR INSERT TO learning_app WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true) AND content_editor());
GRANT SELECT,INSERT,UPDATE ON learning_path,path_draft,import_run TO learning_app;
GRANT SELECT,INSERT ON path_version,content_node,completion_unit,enrollment,content_blob,import_asset,draft_asset,version_asset TO learning_app;
GRANT UPDATE(sealed) ON path_version TO learning_app;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['learning_path','path_draft','path_version','content_node','completion_unit','enrollment','import_run','content_blob','import_asset','draft_asset','version_asset'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_scope ON %I AS RESTRICTIVE TO learning_app USING(workspace_id::text=current_setting(''app.workspace_id'',true)) WITH CHECK(workspace_id::text=current_setting(''app.workspace_id'',true))',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['learning_path','path_draft','draft_asset'] LOOP
  EXECUTE format('CREATE POLICY content_edit ON %I TO learning_app USING(content_editor()) WITH CHECK(content_editor())',t);
 END LOOP;
END $$;
CREATE POLICY import_access ON import_run TO learning_app USING(content_editor() AND (requested_by=actor_id() OR content_owner())) WITH CHECK(content_editor() AND (requested_by=actor_id() OR content_owner()));
CREATE POLICY import_assets ON import_asset TO learning_app USING(content_editor() AND EXISTS(SELECT 1 FROM import_run r WHERE r.id=import_run_id)) WITH CHECK(content_editor());
CREATE POLICY version_read ON path_version FOR SELECT TO learning_app USING(content_version_reader(id) AND sealed);
CREATE POLICY version_write ON path_version FOR INSERT TO learning_app WITH CHECK(content_editor());
CREATE POLICY version_seal ON path_version FOR UPDATE TO learning_app USING(content_editor()) WITH CHECK(content_editor());
CREATE POLICY version_editor ON path_version FOR SELECT TO learning_app USING(content_editor());
CREATE POLICY node_read ON content_node FOR SELECT TO learning_app USING(content_version_reader(path_version_id));
CREATE POLICY node_write ON content_node FOR INSERT TO learning_app WITH CHECK(content_editor());
CREATE POLICY unit_read ON completion_unit FOR SELECT TO learning_app USING(content_version_reader(path_version_id));
CREATE POLICY unit_write ON completion_unit FOR INSERT TO learning_app WITH CHECK(content_editor());
CREATE POLICY version_assets_read ON version_asset FOR SELECT TO learning_app USING(content_version_reader(path_version_id));
CREATE POLICY version_assets_write ON version_asset FOR INSERT TO learning_app WITH CHECK(content_editor());
CREATE POLICY enrollment_access ON enrollment FOR SELECT TO learning_app USING(content_owner() OR EXISTS(SELECT 1 FROM membership m WHERE m.workspace_id=enrollment.workspace_id AND m.user_id=actor_id() AND m.status='active' AND (m.id=learner_membership_id OR (m.id=reviewer_membership_id AND m.role='mentor') OR (m.role='manager' AND EXISTS(SELECT 1 FROM manager_learner r WHERE r.workspace_id=enrollment.workspace_id AND r.manager_membership_id=m.id AND r.learner_membership_id=enrollment.learner_membership_id)))));
CREATE POLICY enrollment_start ON enrollment FOR INSERT TO learning_app WITH CHECK(content_owner() AND origin='personal' AND reviewer_membership_id IS NULL AND manager_membership_id IS NULL AND EXISTS(SELECT 1 FROM workspace w JOIN membership m ON m.workspace_id=w.id WHERE w.id=enrollment.workspace_id AND w.type='personal' AND m.id=learner_membership_id AND m.id=assigned_by AND m.user_id=actor_id() AND m.status='active'));
CREATE POLICY blob_read ON content_blob FOR SELECT TO learning_app USING((content_editor() AND EXISTS(SELECT 1 FROM import_run r WHERE r.id=content_blob.import_run_id)) OR (content_editor() AND EXISTS(SELECT 1 FROM draft_asset a WHERE a.blob_id=content_blob.id)) OR EXISTS(SELECT 1 FROM version_asset a WHERE a.blob_id=content_blob.id AND content_version_reader(a.path_version_id)));
CREATE POLICY blob_write ON content_blob FOR INSERT TO learning_app WITH CHECK(content_editor() AND EXISTS(SELECT 1 FROM import_run r WHERE r.id=import_run_id));

CREATE FUNCTION immutable_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'published content is immutable' USING ERRCODE='42501'; END $$;
CREATE FUNCTION seal_content_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.sealed OR NOT NEW.sealed OR (to_jsonb(NEW)-'sealed')<>(to_jsonb(OLD)-'sealed') THEN RAISE EXCEPTION 'published content is immutable' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER seal_version BEFORE UPDATE ON path_version FOR EACH ROW EXECUTE FUNCTION seal_content_version();
CREATE TRIGGER no_version_delete BEFORE DELETE ON path_version FOR EACH ROW EXECUTE FUNCTION immutable_content();
CREATE FUNCTION insert_unsealed_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM path_version WHERE id=NEW.path_version_id AND workspace_id=NEW.workspace_id AND NOT sealed) THEN RAISE EXCEPTION 'version is sealed or invisible' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['content_node','completion_unit','version_asset'] LOOP
  EXECUTE format('CREATE TRIGGER no_snapshot_edit BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION immutable_content()',t);
  EXECUTE format('CREATE TRIGGER unsealed_insert BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION insert_unsealed_content()',t);
 END LOOP;
END $$;
CREATE FUNCTION require_sealed_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM path_version WHERE id=NEW.id AND NOT sealed) THEN RAISE EXCEPTION 'unsealed publication cannot commit' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER sealed_before_commit AFTER INSERT OR UPDATE ON path_version DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION require_sealed_version();
CREATE FUNCTION require_published_pointer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.published_version_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM path_version WHERE id=NEW.published_version_id AND path_id=NEW.id AND workspace_id=NEW.workspace_id AND sealed) THEN RAISE EXCEPTION 'invalid published version' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER published_pointer BEFORE INSERT OR UPDATE ON learning_path FOR EACH ROW EXECUTE FUNCTION require_published_pointer();
