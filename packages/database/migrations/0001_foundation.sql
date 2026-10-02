CREATE SCHEMA identity;
CREATE TABLE identity."user" (
 id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, email_verified boolean NOT NULL DEFAULT false,
 image text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 preferred_locale text NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en','fa')),
 CHECK (email = lower(trim(email)))
);
CREATE TABLE identity.session (
 id text PRIMARY KEY, expires_at timestamptz NOT NULL, token text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), ip_address text, user_agent text,
 user_id text NOT NULL REFERENCES identity."user"(id) ON DELETE CASCADE
);
CREATE INDEX ON identity.session(user_id);
CREATE TABLE identity.account (
 id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
 user_id text NOT NULL REFERENCES identity."user"(id) ON DELETE CASCADE,
 access_token text, refresh_token text, id_token text, access_token_expires_at timestamptz, refresh_token_expires_at timestamptz,
 scope text, password text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider_id,account_id)
);
CREATE INDEX ON identity.account(user_id);
CREATE TABLE identity.verification (
 id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON identity.verification(identifier);
CREATE TABLE identity.rate_limit (id text PRIMARY KEY, key text NOT NULL UNIQUE, count integer NOT NULL, last_request bigint NOT NULL);
CREATE TABLE workspace (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL CHECK(type IN ('personal','organization')),
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120), timezone text NOT NULL DEFAULT 'UTC', default_locale text NOT NULL DEFAULT 'en' CHECK(default_locale IN ('en','fa')),
 personal_user_id text UNIQUE REFERENCES identity."user"(id), revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((type='personal') = (personal_user_id IS NOT NULL))
);
CREATE TABLE membership (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id), user_id text NOT NULL REFERENCES identity."user"(id),
 role text NOT NULL CHECK(role IN ('owner','manager','mentor','learner')), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','removed')),
 display_name text NOT NULL, email text NOT NULL, revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(workspace_id,user_id), UNIQUE(workspace_id,id)
);
CREATE INDEX ON membership(user_id,status);
CREATE TABLE manager_learner (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id),
 manager_membership_id uuid NOT NULL, learner_membership_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(workspace_id,manager_membership_id) REFERENCES membership(workspace_id,id),
 FOREIGN KEY(workspace_id,learner_membership_id) REFERENCES membership(workspace_id,id),
 UNIQUE(workspace_id,manager_membership_id,learner_membership_id), CHECK(manager_membership_id <> learner_membership_id)
);
CREATE TABLE invitation (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id), token_hash text NOT NULL UNIQUE,
 email text NOT NULL, role text NOT NULL CHECK(role IN ('owner','manager','mentor','learner')), inviter_membership_id uuid NOT NULL,
 manager_membership_id uuid, expires_at timestamptz NOT NULL DEFAULT (now()+interval '7 days'), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','revoked')),
 accepted_by text REFERENCES identity."user"(id), revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(workspace_id,inviter_membership_id) REFERENCES membership(workspace_id,id),
 FOREIGN KEY(workspace_id,manager_membership_id) REFERENCES membership(workspace_id,id)
);
CREATE UNIQUE INDEX invitation_pending ON invitation(workspace_id,email) WHERE status='pending';
CREATE TABLE command_receipt (
 workspace_id uuid NOT NULL REFERENCES workspace(id), actor_id text NOT NULL REFERENCES identity."user"(id), operation text NOT NULL, key text NOT NULL,
 request_hash text NOT NULL, response jsonb NOT NULL, expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours', PRIMARY KEY(workspace_id,actor_id,operation,key)
);
CREATE TABLE audit_record (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspace(id), actor_id text NOT NULL REFERENCES identity."user"(id),
 action text NOT NULL, object_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
-- Infrastructure queue contains encrypted, short-lived email envelopes, never plaintext tokens.
CREATE TABLE mail_delivery (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid REFERENCES workspace(id), invitation_id uuid REFERENCES invitation(id),
 ciphertext text, expires_at timestamptz NOT NULL, next_attempt_at timestamptz NOT NULL DEFAULT now(), attempts integer NOT NULL DEFAULT 0,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON mail_delivery(next_attempt_at) WHERE status='pending';
REVOKE ALL ON SCHEMA identity FROM PUBLIC;
GRANT USAGE ON SCHEMA identity TO learning_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA identity TO learning_auth;
GRANT USAGE ON SCHEMA public TO learning_app,learning_auth,learning_worker;
GRANT SELECT ON workspace,membership,manager_learner,invitation TO learning_app;
GRANT INSERT,UPDATE ON workspace,membership,invitation TO learning_app;
GRANT INSERT,DELETE ON manager_learner TO learning_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON command_receipt TO learning_app;
GRANT INSERT ON audit_record TO learning_app;
GRANT INSERT ON mail_delivery TO learning_app,learning_auth;
GRANT SELECT,UPDATE,DELETE ON mail_delivery TO learning_worker;
GRANT SELECT ON invitation,membership TO learning_worker;
ALTER TABLE workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant ON workspace TO learning_app USING(id::text = current_setting('app.workspace_id',true)) WITH CHECK(id::text = current_setting('app.workspace_id',true));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['membership','manager_learner','invitation','command_receipt','audit_record'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant ON %I TO learning_app USING(workspace_id::text = current_setting(''app.workspace_id'',true)) WITH CHECK(workspace_id::text = current_setting(''app.workspace_id'',true))',t);
 END LOOP;
END $$;
CREATE POLICY worker_tenant ON invitation TO learning_worker USING(workspace_id::text = current_setting('app.workspace_id',true));
CREATE POLICY worker_tenant ON membership TO learning_worker USING(workspace_id::text = current_setting('app.workspace_id',true));
ALTER TABLE mail_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_delivery FORCE ROW LEVEL SECURITY;
CREATE POLICY app_enqueue ON mail_delivery FOR INSERT TO learning_app WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY auth_enqueue ON mail_delivery FOR INSERT TO learning_auth WITH CHECK(workspace_id IS NULL AND invitation_id IS NULL);
CREATE POLICY worker_queue ON mail_delivery TO learning_worker USING(true) WITH CHECK(true);
-- Narrow bootstrap/list/locator functions are the only global domain operations.
-- They run as the migration owner; no generic role or workspace access is exposed.
CREATE FUNCTION actor_id() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id',true),'') $$;
CREATE FUNCTION require_verified_actor() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,identity AS $$
BEGIN IF NOT EXISTS(SELECT 1 FROM identity."user" WHERE id=public.actor_id() AND email_verified) THEN RAISE EXCEPTION 'verified actor required' USING ERRCODE='42501'; END IF; END $$;
CREATE FUNCTION ensure_personal_workspace() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,identity AS $$
DECLARE wid uuid; u identity."user";
BEGIN
 PERFORM public.require_verified_actor(); SELECT * INTO u FROM identity."user" WHERE id=public.actor_id();
 INSERT INTO public.workspace(type,name,personal_user_id,default_locale) VALUES('personal',u.name,u.id,u.preferred_locale) ON CONFLICT(personal_user_id) DO NOTHING;
 SELECT id INTO wid FROM public.workspace WHERE personal_user_id=u.id;
 INSERT INTO public.membership(workspace_id,user_id,role,display_name,email) VALUES(wid,u.id,'owner',u.name,u.email) ON CONFLICT(workspace_id,user_id) DO NOTHING;
 RETURN wid;
END $$;
CREATE FUNCTION list_my_workspaces() RETURNS TABLE(id uuid,type text,name text,timezone text,default_locale text,revision integer,role text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN PERFORM public.require_verified_actor(); RETURN QUERY SELECT w.id,w.type,w.name,w.timezone,w.default_locale,w.revision,m.role FROM public.workspace w JOIN public.membership m ON m.workspace_id=w.id WHERE m.user_id=public.actor_id() AND m.status='active' ORDER BY w.created_at,w.id; END $$;
CREATE FUNCTION create_organization(p_name text,p_timezone text,p_locale text,p_key text,p_hash text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,identity AS $$
DECLARE wid uuid; u identity."user"; receipt public.command_receipt;
BEGIN
 PERFORM public.require_verified_actor(); PERFORM pg_advisory_xact_lock(hashtextextended(public.actor_id()||p_key,0));
 SELECT * INTO receipt FROM public.command_receipt WHERE actor_id=public.actor_id() AND operation='organization.create' AND key=p_key AND expires_at>now();
 IF FOUND THEN IF receipt.request_hash<>p_hash THEN RAISE EXCEPTION 'idempotency conflict' USING ERRCODE='P0002'; END IF; RETURN (receipt.response->>'id')::uuid; END IF;
 SELECT * INTO u FROM identity."user" WHERE id=public.actor_id();
 INSERT INTO public.workspace(type,name,timezone,default_locale) VALUES('organization',p_name,p_timezone,p_locale) RETURNING id INTO wid;
 INSERT INTO public.membership(workspace_id,user_id,role,display_name,email) VALUES(wid,u.id,'owner',u.name,u.email);
 INSERT INTO public.command_receipt(workspace_id,actor_id,operation,key,request_hash,response) VALUES(wid,u.id,'organization.create',p_key,p_hash,jsonb_build_object('id',wid));
 INSERT INTO public.audit_record(workspace_id,actor_id,action,object_id) VALUES(wid,u.id,'workspace.created',wid);
 RETURN wid;
END $$;
CREATE FUNCTION locate_invitation(p_hash text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,identity AS $$
DECLARE wid uuid;
BEGIN PERFORM public.require_verified_actor(); SELECT i.workspace_id INTO wid FROM public.invitation i JOIN identity."user" u ON u.email=i.email WHERE i.token_hash=p_hash AND u.id=public.actor_id(); RETURN wid; END $$;
REVOKE ALL ON FUNCTION require_verified_actor(),ensure_personal_workspace(),list_my_workspaces(),create_organization(text,text,text,text,text),locate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_personal_workspace(),list_my_workspaces(),create_organization(text,text,text,text,text),locate_invitation(text) TO learning_app;
