--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    guide_id integer NOT NULL,
    seeker_id integer,
    seeker_name character varying(100) NOT NULL,
    avatar character varying(10) DEFAULT '👤'::character varying,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    duration integer NOT NULL,
    type character varying(50) NOT NULL,
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    recurrence_rule character varying(20) DEFAULT 'none'::character varying,
    series_id uuid,
    recurrence_end_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT appointments_duration_check CHECK ((duration = ANY (ARRAY[30, 60, 90, 120]))),
    CONSTRAINT appointments_recurrence_rule_check CHECK (((recurrence_rule)::text = ANY ((ARRAY['none'::character varying, 'weekly'::character varying, 'biweekly'::character varying, 'monthly'::character varying])::text[]))),
    CONSTRAINT appointments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'declined'::character varying])::text[]))),
    CONSTRAINT appointments_type_check CHECK (((type)::text = ANY ((ARRAY['Bible Study'::character varying, 'Prayer Session'::character varying, 'Counseling'::character varying, 'General Guidance'::character varying])::text[])))
);


--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: bible_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bible_quotes (
    id integer NOT NULL,
    text text NOT NULL,
    ref character varying(100) NOT NULL
);


--
-- Name: bible_quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bible_quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bible_quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bible_quotes_id_seq OWNED BY public.bible_quotes.id;


--
-- Name: church_account_guides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.church_account_guides (
    church_account_id integer NOT NULL,
    guide_id integer NOT NULL,
    verified_at timestamp with time zone DEFAULT now()
);


--
-- Name: church_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.church_accounts (
    id integer NOT NULL,
    church_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    onboarding_completed boolean DEFAULT false,
    CONSTRAINT church_accounts_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'suspended'::character varying])::text[])))
);


--
-- Name: church_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.church_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: church_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.church_accounts_id_seq OWNED BY public.church_accounts.id;


--
-- Name: church_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.church_announcements (
    id integer NOT NULL,
    church_id integer NOT NULL,
    author_id integer NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    category character varying(50) DEFAULT 'Announcement'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT church_announcements_category_check CHECK (((category)::text = ANY ((ARRAY['Announcement'::character varying, 'Upcoming Sermon'::character varying, 'Schedule Change'::character varying, 'Church Need'::character varying, 'Event'::character varying])::text[])))
);


--
-- Name: church_announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.church_announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: church_announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.church_announcements_id_seq OWNED BY public.church_announcements.id;


--
-- Name: church_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.church_favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    church_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: church_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.church_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: church_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.church_favorites_id_seq OWNED BY public.church_favorites.id;


--
-- Name: church_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.church_reviews (
    id integer NOT NULL,
    user_id integer NOT NULL,
    church_id integer NOT NULL,
    rating integer NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    rating_worship integer,
    rating_sermon integer,
    rating_community integer,
    rating_youth integer,
    rating_children integer,
    rating_biblestudy integer,
    rating_parking integer,
    rating_facilities integer,
    CONSTRAINT church_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: church_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.church_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: church_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.church_reviews_id_seq OWNED BY public.church_reviews.id;


--
-- Name: churches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.churches (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    address character varying(300) NOT NULL,
    city character varying(100) NOT NULL,
    zip character varying(10) NOT NULL,
    sunday_school boolean DEFAULT false,
    recommended_ages character varying(50),
    hours text,
    rating_singing numeric(2,1) DEFAULT 0,
    rating_preaching numeric(2,1) DEFAULT 0,
    rating_openness numeric(2,1) DEFAULT 0,
    rating_space numeric(2,1) DEFAULT 0,
    overall_rating numeric(2,1) DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    state character varying(50),
    phone character varying(20),
    website text,
    short_description text,
    photo_url text,
    google_place_id character varying(255),
    avg_worship numeric(2,1),
    avg_sermon numeric(2,1),
    avg_community numeric(2,1),
    avg_youth numeric(2,1),
    avg_children numeric(2,1),
    avg_biblestudy numeric(2,1),
    avg_parking numeric(2,1),
    avg_facilities numeric(2,1),
    google_rating numeric(2,1),
    custom_description text,
    custom_hours text,
    custom_programs text,
    managed_by integer,
    featured_plan_id integer
);


--
-- Name: churches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.churches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: churches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.churches_id_seq OWNED BY public.churches.id;


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_participants (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_participants_id_seq OWNED BY public.conversation_participants.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    person_id integer,
    last_message text,
    last_time character varying(20),
    unread_count integer DEFAULT 0,
    is_group boolean DEFAULT false,
    group_name character varying(100),
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_sender_id integer
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_rsvps (
    id integer NOT NULL,
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_rsvps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_rsvps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_rsvps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_rsvps_id_seq OWNED BY public.event_rsvps.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    date_time timestamp without time zone NOT NULL,
    location character varying(300),
    category character varying(50) DEFAULT 'Social'::character varying NOT NULL,
    created_by integer,
    church_id integer,
    created_at timestamp with time zone DEFAULT now(),
    event_type character varying(20) DEFAULT 'in_person'::character varying NOT NULL,
    event_link text,
    is_live boolean DEFAULT false,
    CONSTRAINT events_category_check CHECK (((category)::text = ANY ((ARRAY['Social'::character varying, 'Service/Mission'::character varying, 'Youth'::character varying, 'Worship'::character varying, 'Active/Outdoor'::character varying, 'Sermons/Teachings'::character varying, 'Prayer'::character varying, 'Bible Study'::character varying, 'General'::character varying])::text[])))
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: guide_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    guide_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: guide_follows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guide_follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guide_follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guide_follows_id_seq OWNED BY public.guide_follows.id;


--
-- Name: guide_post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_post_likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: guide_post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guide_post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guide_post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guide_post_likes_id_seq OWNED BY public.guide_post_likes.id;


--
-- Name: guide_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    post_type character varying(20) DEFAULT 'general'::character varying NOT NULL,
    scripture_ref character varying(200),
    like_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT guide_posts_type_check CHECK (((post_type)::text = ANY ((ARRAY['devotional'::character varying, 'reflection'::character varying, 'scripture'::character varying, 'general'::character varying])::text[])))
);


--
-- Name: guide_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guide_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guide_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guide_posts_id_seq OWNED BY public.guide_posts.id;


--
-- Name: guide_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_reviews (
    id integer NOT NULL,
    guide_id integer NOT NULL,
    seeker_id integer NOT NULL,
    appointment_id integer,
    rating integer NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT guide_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: guide_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guide_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guide_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guide_reviews_id_seq OWNED BY public.guide_reviews.id;


--
-- Name: guide_waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_waitlist (
    id integer NOT NULL,
    guide_id integer NOT NULL,
    seeker_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    notified_at timestamp with time zone
);


--
-- Name: guide_waitlist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guide_waitlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guide_waitlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guide_waitlist_id_seq OWNED BY public.guide_waitlist.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    appointment_id integer
);


--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    actor_id integer,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    body text,
    reference_type character varying(50),
    reference_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['new_message'::character varying, 'connection_request'::character varying, 'connection_accepted'::character varying, 'prayer_prayed'::character varying, 'prayer_comment'::character varying, 'testimony_celebration'::character varying, 'event_rsvp'::character varying, 'appointment_request'::character varying, 'appointment_confirmed'::character varying, 'appointment_declined'::character varying, 'appointment_scheduled'::character varying, 'church_announcement'::character varying, 'waitlist_spot_open'::character varying, 'guide_review_prompt'::character varying])::text[])))
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    code_hash character varying(255) NOT NULL,
    method character varying(10) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT password_resets_method_check CHECK (((method)::text = ANY ((ARRAY['email'::character varying, 'phone'::character varying])::text[])))
);


--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: prayer_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prayer_interactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    request_id integer NOT NULL,
    type character varying(20) NOT NULL,
    comment_text text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT prayer_interactions_type_check CHECK (((type)::text = ANY ((ARRAY['prayed'::character varying, 'comment'::character varying])::text[])))
);


--
-- Name: prayer_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prayer_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prayer_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prayer_interactions_id_seq OWNED BY public.prayer_interactions.id;


--
-- Name: prayer_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prayer_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    is_anonymous boolean DEFAULT false,
    prayer_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type character varying(20) DEFAULT 'prayer'::character varying NOT NULL,
    linked_prayer_id integer,
    CONSTRAINT prayer_requests_category_check CHECK (((category)::text = ANY ((ARRAY['Health'::character varying, 'Family'::character varying, 'Guidance'::character varying, 'Gratitude'::character varying, 'Financial'::character varying, 'Other'::character varying])::text[]))),
    CONSTRAINT prayer_requests_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'answered'::character varying])::text[])))
);


--
-- Name: prayer_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prayer_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prayer_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prayer_requests_id_seq OWNED BY public.prayer_requests.id;


--
-- Name: reading_plan_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plan_days (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    day_number integer NOT NULL,
    title character varying(200) NOT NULL,
    reference character varying(100) NOT NULL
);


--
-- Name: reading_plan_days_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reading_plan_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reading_plan_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reading_plan_days_id_seq OWNED BY public.reading_plan_days.id;


--
-- Name: reading_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plans (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    total_days integer NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    church_account_id integer
);


--
-- Name: reading_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reading_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reading_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reading_plans_id_seq OWNED BY public.reading_plans.id;


--
-- Name: scripture_verses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scripture_verses (
    id integer NOT NULL,
    text text NOT NULL,
    reference character varying(100) NOT NULL,
    category character varying(50) NOT NULL
);


--
-- Name: scripture_verses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scripture_verses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scripture_verses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scripture_verses_id_seq OWNED BY public.scripture_verses.id;


--
-- Name: user_bible_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bible_bookmarks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    book character varying(50) NOT NULL,
    chapter integer NOT NULL,
    verse integer,
    note text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_bible_bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_bible_bookmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_bible_bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_bible_bookmarks_id_seq OWNED BY public.user_bible_bookmarks.id;


--
-- Name: user_bible_highlights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bible_highlights (
    id integer NOT NULL,
    user_id integer NOT NULL,
    book character varying(50) NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    color character varying(20) DEFAULT 'yellow'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_bible_highlights_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_bible_highlights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_bible_highlights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_bible_highlights_id_seq OWNED BY public.user_bible_highlights.id;


--
-- Name: user_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_blocks (
    id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_blocks_id_seq OWNED BY public.user_blocks.id;


--
-- Name: user_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_connections (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    recipient_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_connections_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[])))
);


--
-- Name: user_connections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_connections_id_seq OWNED BY public.user_connections.id;


--
-- Name: user_memorization_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_memorization_stats (
    id integer NOT NULL,
    user_id integer NOT NULL,
    verse_id integer NOT NULL,
    mode character varying(20) NOT NULL,
    attempts integer DEFAULT 0,
    correct_count integer DEFAULT 0,
    last_practiced timestamp with time zone
);


--
-- Name: user_memorization_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_memorization_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_memorization_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_memorization_stats_id_seq OWNED BY public.user_memorization_stats.id;


--
-- Name: user_reading_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_reading_progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan_id integer NOT NULL,
    completed_days integer[] DEFAULT '{}'::integer[],
    started_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_reading_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_reading_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_reading_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_reading_progress_id_seq OWNED BY public.user_reading_progress.id;


--
-- Name: user_study_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_study_streaks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_study_date date
);


--
-- Name: user_study_streaks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_study_streaks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_study_streaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_study_streaks_id_seq OWNED BY public.user_study_streaks.id;


--
-- Name: user_verse_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_verse_bookmarks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    verse_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_verse_bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_verse_bookmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_verse_bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_verse_bookmarks_id_seq OWNED BY public.user_verse_bookmarks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    avatar character varying(10) DEFAULT '🙏'::character varying,
    photo_url text,
    role character varying(20) DEFAULT 'seeker'::character varying NOT NULL,
    bio text,
    specialization character varying(100),
    location character varying(100),
    denomination character varying(100),
    church_name character varying(100),
    interests text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    state character varying(2),
    city character varying(100),
    preferred_church_id integer,
    accepting_seekers boolean DEFAULT true,
    max_pending_requests integer DEFAULT 5,
    onboarding_completed boolean DEFAULT false,
    phone_number character varying(20),
    follower_count integer DEFAULT 0,
    overall_rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['guide'::character varying, 'seeker'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: bible_quotes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_quotes ALTER COLUMN id SET DEFAULT nextval('public.bible_quotes_id_seq'::regclass);


--
-- Name: church_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_accounts ALTER COLUMN id SET DEFAULT nextval('public.church_accounts_id_seq'::regclass);


--
-- Name: church_announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_announcements ALTER COLUMN id SET DEFAULT nextval('public.church_announcements_id_seq'::regclass);


--
-- Name: church_favorites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_favorites ALTER COLUMN id SET DEFAULT nextval('public.church_favorites_id_seq'::regclass);


--
-- Name: church_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_reviews ALTER COLUMN id SET DEFAULT nextval('public.church_reviews_id_seq'::regclass);


--
-- Name: churches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.churches ALTER COLUMN id SET DEFAULT nextval('public.churches_id_seq'::regclass);


--
-- Name: conversation_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants ALTER COLUMN id SET DEFAULT nextval('public.conversation_participants_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: event_rsvps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps ALTER COLUMN id SET DEFAULT nextval('public.event_rsvps_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: guide_follows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_follows ALTER COLUMN id SET DEFAULT nextval('public.guide_follows_id_seq'::regclass);


--
-- Name: guide_post_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_post_likes ALTER COLUMN id SET DEFAULT nextval('public.guide_post_likes_id_seq'::regclass);


--
-- Name: guide_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_posts ALTER COLUMN id SET DEFAULT nextval('public.guide_posts_id_seq'::regclass);


--
-- Name: guide_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_reviews ALTER COLUMN id SET DEFAULT nextval('public.guide_reviews_id_seq'::regclass);


--
-- Name: guide_waitlist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_waitlist ALTER COLUMN id SET DEFAULT nextval('public.guide_waitlist_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: prayer_interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_interactions ALTER COLUMN id SET DEFAULT nextval('public.prayer_interactions_id_seq'::regclass);


--
-- Name: prayer_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_requests ALTER COLUMN id SET DEFAULT nextval('public.prayer_requests_id_seq'::regclass);


--
-- Name: reading_plan_days id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_days ALTER COLUMN id SET DEFAULT nextval('public.reading_plan_days_id_seq'::regclass);


--
-- Name: reading_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plans ALTER COLUMN id SET DEFAULT nextval('public.reading_plans_id_seq'::regclass);


--
-- Name: scripture_verses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scripture_verses ALTER COLUMN id SET DEFAULT nextval('public.scripture_verses_id_seq'::regclass);


--
-- Name: user_bible_bookmarks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_bookmarks ALTER COLUMN id SET DEFAULT nextval('public.user_bible_bookmarks_id_seq'::regclass);


--
-- Name: user_bible_highlights id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_highlights ALTER COLUMN id SET DEFAULT nextval('public.user_bible_highlights_id_seq'::regclass);


--
-- Name: user_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks ALTER COLUMN id SET DEFAULT nextval('public.user_blocks_id_seq'::regclass);


--
-- Name: user_connections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections ALTER COLUMN id SET DEFAULT nextval('public.user_connections_id_seq'::regclass);


--
-- Name: user_memorization_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memorization_stats ALTER COLUMN id SET DEFAULT nextval('public.user_memorization_stats_id_seq'::regclass);


--
-- Name: user_reading_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reading_progress ALTER COLUMN id SET DEFAULT nextval('public.user_reading_progress_id_seq'::regclass);


--
-- Name: user_study_streaks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_study_streaks ALTER COLUMN id SET DEFAULT nextval('public.user_study_streaks_id_seq'::regclass);


--
-- Name: user_verse_bookmarks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verse_bookmarks ALTER COLUMN id SET DEFAULT nextval('public.user_verse_bookmarks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, guide_id, seeker_id, seeker_name, avatar, date, "time", duration, type, notes, status, recurrence_rule, series_id, recurrence_end_date, created_at, updated_at) FROM stdin;
1	1	\N	Ben Dover	👤	2026-02-05	17:30:00	60	Bible Study	Tell me about the burning bush	confirmed	none	\N	\N	2026-02-08 03:07:38.39213+00	2026-02-08 03:07:38.39213+00
2	1	\N	Phil Macrackin	👤	2026-02-07	17:30:00	60	Bible Study	Did Jesus really walk on water? Let's discuss	pending	none	\N	\N	2026-02-08 03:07:38.507314+00	2026-02-08 03:07:38.507314+00
3	1	\N	Ben Dover	👤	2026-02-05	17:30:00	60	Bible Study	Tell me about the burning bush	confirmed	none	\N	\N	2026-02-17 01:51:31.708825+00	2026-02-17 01:51:31.708825+00
4	1	\N	Phil Macrackin	👤	2026-02-07	17:30:00	60	Bible Study	Did Jesus really walk on water? Let's discuss	pending	none	\N	\N	2026-02-17 01:51:31.801266+00	2026-02-17 01:51:31.801266+00
\.


--
-- Data for Name: bible_quotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bible_quotes (id, text, ref) FROM stdin;
1	For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.	John 3:16
2	I can do all things through Christ who strengthens me.	Philippians 4:13
3	The Lord is my shepherd; I shall not want.	Psalm 23:1
4	Be strong and courageous. The Lord your God is with you wherever you go.	Joshua 1:9
5	Trust in the Lord with all your heart and lean not on your own understanding.	Proverbs 3:5
6	He has made everything beautiful in its time.	Ecclesiastes 3:11
7	For I know the plans I have for you — plans to prosper you and not to harm you.	Jeremiah 29:11
8	The Lord bless you and keep you; the Lord make His face shine upon you.	Numbers 6:24–25
9	Greater love has no one than this: to lay down one's life for one's friends.	John 15:13
10	Be still and know that I am God.	Psalm 46:10
11	The steadfast love of the Lord never ceases; His mercies are new every morning.	Lamentations 3:22–23
12	For nothing is impossible with God.	Matthew 19:26
13	Let all that you do be done in love.	1 Corinthians 16:14
14	He heals the brokenhearted and binds up their wounds.	Psalm 147:3
15	Cast all your anxiety on Him because He cares for you.	1 Peter 5:7
16	Walk by faith, not by sight.	2 Corinthians 5:7
17	Delight yourself in the Lord, and He will give you the desires of your heart.	Psalm 37:4
18	My peace I give to you, not as the world gives.	John 14:27
19	Seek first His kingdom and His righteousness, and all these things shall be added.	Matthew 6:33
20	The joy of the Lord is your strength.	Nehemiah 8:10
21	Fear not, for I am with you; be not dismayed, for I am your God.	Isaiah 41:10
\.


--
-- Data for Name: church_account_guides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.church_account_guides (church_account_id, guide_id, verified_at) FROM stdin;
1	1	2026-02-26 03:12:02.917275+00
\.


--
-- Data for Name: church_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.church_accounts (id, church_id, email, password_hash, display_name, status, verified_at, created_at, updated_at, onboarding_completed) FROM stdin;
1	1	church@sanctuary.com	$2b$10$LOQGRa7nRnSQvQ3gAZa/2OTt4JHEtrMBAzHAqVzq49XlyjAQ.silq	Willow Creek Admin	active	2026-02-26 03:12:02.913193+00	2026-02-26 03:12:02.913193+00	2026-02-26 03:12:02.913193+00	f
\.


--
-- Data for Name: church_announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.church_announcements (id, church_id, author_id, title, message, category, created_at) FROM stdin;
1	1	1	New Service Time Starting March	Beginning March 1st, our Sunday morning service times will change to 9:30 AM and 11:30 AM. Wednesday evening services remain at 7:00 PM.	Schedule Change	2026-02-17 01:51:44.033824+00
2	1	1	Volunteers Needed for Spring Festival	We need 20 volunteers for our annual Spring Festival on March 15th. Sign up at the welcome desk or contact the office.	Church Need	2026-02-17 01:51:44.131982+00
3	2	45	Youth Retreat Registration Open	Registration is now open for our spring youth retreat, April 10-12. Cost is $75 per student. Scholarships available.	Announcement	2026-02-17 01:51:44.23562+00
4	1	12	This Sunday: Guest Speaker Rev. Thomas	We are excited to welcome Reverend James Thomas as our guest speaker this Sunday. He will be sharing on "Finding Rest in a Restless World."	Upcoming Sermon	2026-02-17 01:51:44.349747+00
\.


--
-- Data for Name: church_favorites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.church_favorites (id, user_id, church_id, created_at) FROM stdin;
\.


--
-- Data for Name: church_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.church_reviews (id, user_id, church_id, rating, review_text, created_at, updated_at, rating_worship, rating_sermon, rating_community, rating_youth, rating_children, rating_biblestudy, rating_parking, rating_facilities) FROM stdin;
\.


--
-- Data for Name: churches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.churches (id, name, address, city, zip, sunday_school, recommended_ages, hours, rating_singing, rating_preaching, rating_openness, rating_space, overall_rating, review_count, created_at, state, phone, website, short_description, photo_url, google_place_id, avg_worship, avg_sermon, avg_community, avg_youth, avg_children, avg_biblestudy, avg_parking, avg_facilities, google_rating, custom_description, custom_hours, custom_programs, managed_by, featured_plan_id) FROM stdin;
2	Holy Name Cathedral	1555 N State Pkwy	Chicago	60610	t	Ages 5–14	Sun 8:00 & 10:30 AM	4.0	4.5	4.5	5.0	4.5	142	2026-02-08 03:07:35.835535+00	IL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	Brooklyn Tabernacle	11 Atlantic Ave	Brooklyn	11217	t	Ages 3–12	Sun 9:00 & 11:30 AM	5.0	5.0	4.5	4.0	4.8	445	2026-02-08 03:07:35.923397+00	NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	Lakewood Church	3700 Lake Mercer Dr	Houston	77054	t	Ages 3–16	Sun 8:45 & 10:45 AM	5.0	5.0	4.5	5.0	4.8	621	2026-02-08 03:07:36.048177+00	TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	National Cathedral	3001 Massachusetts Ave NW	Washington	20016	t	Ages 5–16	Sun 8:30 & 11:00 AM	5.0	5.0	4.5	5.0	4.8	267	2026-02-08 03:07:36.182841+00	DC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	Willow Creek Church	67 E Wacker Dr	Chicago	60601	t	Ages 3–12	Sun 9:00 & 11:00 AM	4.5	5.0	4.0	4.5	4.5	88	2026-02-08 03:07:35.749708+00	IL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation_participants (id, conversation_id, user_id, joined_at) FROM stdin;
1	2	7	2026-02-17 01:51:53.052836+00
2	2	12	2026-02-17 01:51:53.052836+00
3	3	7	2026-02-17 01:51:53.826703+00
4	3	19	2026-02-17 01:51:53.826703+00
5	4	7	2026-02-17 01:51:54.505947+00
6	4	33	2026-02-17 01:51:54.505947+00
7	5	7	2026-02-17 01:51:55.277398+00
8	5	8	2026-02-17 01:51:55.277398+00
9	6	1	2026-02-17 01:51:55.882949+00
10	6	13	2026-02-17 01:51:55.882949+00
11	7	1	2026-02-17 01:51:56.777831+00
12	7	15	2026-02-17 01:51:56.777831+00
13	8	1	2026-02-17 01:51:57.414417+00
14	8	30	2026-02-17 01:51:57.414417+00
15	9	1	2026-02-17 01:51:58.22961+00
16	9	29	2026-02-17 01:51:58.22961+00
17	10	1	2026-02-17 01:51:58.937612+00
18	10	18	2026-02-17 01:51:58.937612+00
19	11	1	2026-02-17 01:51:59.526876+00
20	11	22	2026-02-17 01:51:59.526876+00
21	12	1	2026-02-17 01:52:00.208736+00
22	12	32	2026-02-17 01:52:00.208736+00
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, owner_id, person_id, last_message, last_time, unread_count, is_group, group_name, created_by, created_at, updated_at, last_sender_id) FROM stdin;
2	7	12	That would be amazing, thank you! I am free most evenings.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:52.963378+00	2026-02-17 01:51:52.963378+00	7
3	7	19	For sure! There is a great spot on Michigan Ave. Let me know when you are free.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:53.74255+00	2026-02-17 01:51:53.74255+00	7
4	7	33	Of course. Keep us posted. Your family is in my prayers.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:54.421204+00	2026-02-17 01:51:54.421204+00	7
5	7	8	Haha trust me, we have all been there. I will send you the details for Thursday.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:55.186232+00	2026-02-17 01:51:55.186232+00	8
6	1	13	He is great. Really hungry to learn and grow. Those are the ones that keep you going in ministry.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:55.799228+00	2026-02-17 01:51:55.799228+00	1
7	1	15	Amen to that. I have been doing more one on one sessions through this app and it is been really rewarding.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:56.683243+00	2026-02-17 01:51:56.683243+00	1
8	1	30	Absolutely. I will book something this week. Thank you Pastor Mike.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:57.327585+00	2026-02-17 01:51:57.327585+00	30
9	1	29	Perfect! Psalms is like a spiritual first aid kit. Keep at it and do not be hard on yourself. God meets us where we are, not where we think we should be.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:58.124726+00	2026-02-17 01:51:58.124726+00	1
10	1	18	Not yet, but that is a good idea. I will look into it. Thank you for listening.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:58.852511+00	2026-02-17 01:51:58.852511+00	18
11	1	22	Absolutely, I will connect you with our events coordinator. Your gift of hospitality is going to bless a lot of people Aisha.	1:51 AM	0	f	\N	\N	2026-02-17 01:51:59.442846+00	2026-02-17 01:51:59.442846+00	1
12	1	32	Will do. Thank you Pastor Mike. This app has been such a blessing.	1:52 AM	0	f	\N	\N	2026-02-17 01:52:00.120794+00	2026-02-17 01:52:00.120794+00	32
\.


--
-- Data for Name: event_rsvps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_rsvps (id, event_id, user_id, created_at) FROM stdin;
1	1	1	2026-02-17 01:51:32.108676+00
2	2	45	2026-02-17 01:51:32.294951+00
3	3	12	2026-02-17 01:51:32.480877+00
4	4	44	2026-02-17 01:51:32.649723+00
5	5	1	2026-02-17 01:51:32.817179+00
6	6	25	2026-02-17 01:51:32.98687+00
7	7	24	2026-02-17 01:51:33.157999+00
8	8	28	2026-02-17 01:51:33.326023+00
9	9	1	2026-02-17 01:51:33.495303+00
10	10	15	2026-02-17 01:51:33.663467+00
11	11	16	2026-02-17 01:51:33.90094+00
12	12	17	2026-02-17 01:51:34.08742+00
13	13	13	2026-02-17 01:51:34.268064+00
14	14	27	2026-02-17 01:51:34.4374+00
15	15	25	2026-02-17 01:51:34.619384+00
16	1	7	2026-02-17 01:51:34.708292+00
18	1	8	2026-02-17 01:51:34.873742+00
19	1	9	2026-02-17 01:51:34.959043+00
20	2	9	2026-02-17 01:51:35.049164+00
21	2	10	2026-02-17 01:51:35.134418+00
22	2	11	2026-02-17 01:51:35.223755+00
23	2	12	2026-02-17 01:51:35.312445+00
24	2	13	2026-02-17 01:51:35.403343+00
26	3	13	2026-02-17 01:51:35.584042+00
27	3	14	2026-02-17 01:51:35.680694+00
28	3	15	2026-02-17 01:51:35.767352+00
29	3	16	2026-02-17 01:51:35.853178+00
30	3	17	2026-02-17 01:51:35.941379+00
31	4	15	2026-02-17 01:51:36.032951+00
32	4	16	2026-02-17 01:51:36.125719+00
33	4	17	2026-02-17 01:51:36.209014+00
34	4	18	2026-02-17 01:51:36.293635+00
35	4	19	2026-02-17 01:51:36.381465+00
36	4	20	2026-02-17 01:51:36.468549+00
37	4	21	2026-02-17 01:51:36.553365+00
38	5	18	2026-02-17 01:51:36.643932+00
39	5	19	2026-02-17 01:51:36.73039+00
40	5	20	2026-02-17 01:51:36.81369+00
41	5	21	2026-02-17 01:51:36.904886+00
42	5	22	2026-02-17 01:51:36.988377+00
43	5	23	2026-02-17 01:51:37.071313+00
44	5	24	2026-02-17 01:51:37.155068+00
45	5	25	2026-02-17 01:51:37.238595+00
46	6	21	2026-02-17 01:51:37.322253+00
47	6	22	2026-02-17 01:51:37.405737+00
48	6	23	2026-02-17 01:51:37.499241+00
49	6	24	2026-02-17 01:51:37.588954+00
51	6	26	2026-02-17 01:51:37.756845+00
52	6	27	2026-02-17 01:51:37.844256+00
53	6	28	2026-02-17 01:51:37.929327+00
54	6	29	2026-02-17 01:51:38.014129+00
56	7	25	2026-02-17 01:51:38.193261+00
57	7	26	2026-02-17 01:51:38.277909+00
58	7	27	2026-02-17 01:51:38.400792+00
59	7	28	2026-02-17 01:51:38.501164+00
60	7	29	2026-02-17 01:51:38.600515+00
61	7	30	2026-02-17 01:51:38.684651+00
62	7	31	2026-02-17 01:51:38.768623+00
63	7	32	2026-02-17 01:51:38.852082+00
64	7	33	2026-02-17 01:51:38.936642+00
65	8	27	2026-02-17 01:51:39.020239+00
67	8	29	2026-02-17 01:51:39.188728+00
68	8	30	2026-02-17 01:51:39.273418+00
69	9	30	2026-02-17 01:51:39.359419+00
70	9	31	2026-02-17 01:51:39.445029+00
71	9	32	2026-02-17 01:51:39.532102+00
72	9	33	2026-02-17 01:51:39.615514+00
73	9	34	2026-02-17 01:51:39.699096+00
74	10	33	2026-02-17 01:51:39.784647+00
75	10	34	2026-02-17 01:51:39.868672+00
76	10	35	2026-02-17 01:51:39.973324+00
77	10	36	2026-02-17 01:51:40.062274+00
78	10	37	2026-02-17 01:51:40.147328+00
79	10	38	2026-02-17 01:51:40.233746+00
80	11	36	2026-02-17 01:51:40.331847+00
81	11	37	2026-02-17 01:51:40.422154+00
82	11	38	2026-02-17 01:51:40.512902+00
83	11	39	2026-02-17 01:51:40.603459+00
84	11	40	2026-02-17 01:51:40.689084+00
85	11	41	2026-02-17 01:51:40.774836+00
86	11	42	2026-02-17 01:51:40.85896+00
87	12	39	2026-02-17 01:51:40.949419+00
88	12	40	2026-02-17 01:51:41.043242+00
89	12	41	2026-02-17 01:51:41.127047+00
90	12	42	2026-02-17 01:51:41.212824+00
91	12	43	2026-02-17 01:51:41.299678+00
92	12	7	2026-02-17 01:51:41.388704+00
93	12	1	2026-02-17 01:51:41.489282+00
94	12	8	2026-02-17 01:51:41.606256+00
95	13	42	2026-02-17 01:51:41.759164+00
96	13	43	2026-02-17 01:51:41.885958+00
97	13	7	2026-02-17 01:51:41.986619+00
98	13	1	2026-02-17 01:51:42.073483+00
99	13	8	2026-02-17 01:51:42.170567+00
100	13	9	2026-02-17 01:51:42.260944+00
101	13	10	2026-02-17 01:51:42.373817+00
102	13	11	2026-02-17 01:51:42.467034+00
103	13	12	2026-02-17 01:51:42.556464+00
104	14	1	2026-02-17 01:51:42.641048+00
105	14	8	2026-02-17 01:51:42.736364+00
106	14	9	2026-02-17 01:51:42.828809+00
107	14	10	2026-02-17 01:51:42.912523+00
108	14	11	2026-02-17 01:51:43.009032+00
109	14	12	2026-02-17 01:51:43.099641+00
110	14	13	2026-02-17 01:51:43.213563+00
111	14	14	2026-02-17 01:51:43.297939+00
112	14	15	2026-02-17 01:51:43.386105+00
113	14	16	2026-02-17 01:51:43.472887+00
114	15	10	2026-02-17 01:51:43.579471+00
115	15	11	2026-02-17 01:51:43.683454+00
116	15	12	2026-02-17 01:51:43.768718+00
117	15	13	2026-02-17 01:51:43.873721+00
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, description, date_time, location, category, created_by, church_id, created_at, event_type, event_link, is_live) FROM stdin;
1	Community Prayer Walk	Join us for a peaceful prayer walk through Grant Park. All are welcome! We will meet at the main fountain and walk together for about an hour.	2026-02-15 10:00:00	Grant Park, Chicago	Worship	1	1	2026-02-17 01:51:32.004534+00	in_person	\N	f
2	Youth Game Night	Fun-filled evening with board games, snacks, and fellowship for teens and young adults ages 13-25.	2026-02-20 18:30:00	Holy Name Cathedral Hall	Youth	45	2	2026-02-17 01:51:32.200403+00	in_person	\N	f
3	Neighborhood Cleanup	Let's serve our community! Gloves and bags provided. Meet in the church parking lot.	2026-02-22 09:00:00	Willow Creek Church Parking Lot	Service/Mission	12	1	2026-02-17 01:51:32.382728+00	in_person	\N	f
4	Hiking & Devotional	A morning hike followed by a short outdoor devotional. Moderate trail, about 3 miles. Bring water!	2026-03-01 08:00:00	Starved Rock State Park	Active/Outdoor	44	\N	2026-02-17 01:51:32.565775+00	in_person	\N	f
5	Potluck Fellowship Dinner	Bring a dish to share and enjoy an evening of food and community. Sign up sheet for dishes in the lobby.	2026-02-28 17:00:00	Willow Creek Church Fellowship Hall	Social	1	1	2026-02-17 01:51:32.733203+00	in_person	\N	f
6	Women's Brunch & Bible Study	Ladies, join us for a morning of fellowship, brunch, and a study on Proverbs 31. Bring a friend!	2026-02-21 10:00:00	Lakewood Church Fellowship Hall	Social	25	4	2026-02-17 01:51:32.902987+00	in_person	\N	f
7	Men's Breakfast Fellowship	Monthly men's breakfast. Good food, great conversation, and a short devotional. All men welcome.	2026-03-07 08:00:00	Willow Creek Church Cafe	Social	24	1	2026-02-17 01:51:33.07405+00	in_person	\N	f
8	Community Food Drive	Help us collect non-perishable food items for local families in need. Drop-off at the church lobby or join us for sorting and delivery.	2026-02-25 09:00:00	Holy Name Cathedral Lobby	Service/Mission	28	2	2026-02-17 01:51:33.242152+00	in_person	\N	f
9	Sunday Morning Livestream	Join us live for our regular Sunday morning worship service, streamed from Willow Creek Church. Worship, prayer, and a message from Pastor Mike.	2026-02-16 10:00:00	\N	Worship	1	1	2026-02-17 01:51:33.411409+00	digital	https://youtube.com/live/sanctuary-sunday	t
10	Faith Foundations: Gospel of John	A recorded series walking through the Gospel of John. Watch at your own pace and discuss in the community.	2026-02-10 12:00:00	\N	Sermons/Teachings	15	3	2026-02-17 01:51:33.579067+00	digital	https://youtube.com/watch?v=gospel-of-john	f
11	Online Prayer Circle	A weekly prayer gathering via Zoom. Everyone is welcome to share requests and pray together in a safe, supportive space.	2026-02-18 19:00:00	\N	Prayer	16	\N	2026-02-17 01:51:33.751092+00	digital	https://zoom.us/j/sanctuary-prayer	t
12	Intro to Psalms - Bible Study	A recorded deep-dive into the Book of Psalms. Great for personal study or small group discussion.	2026-02-12 09:00:00	\N	Bible Study	17	\N	2026-02-17 01:51:34.000004+00	digital	https://youtube.com/watch?v=psalms-study	f
13	Evening Worship & Praise	Live worship session streaming from Atlanta. Grab your Bible and worship with us from anywhere!	2026-02-21 20:00:00	\N	Worship	13	4	2026-02-17 01:51:34.183892+00	digital	https://youtube.com/live/evening-worship	t
14	Parenting Through Faith	A recorded talk on raising children with spiritual values in a modern world. Practical tips and encouragement for parents.	2026-02-14 12:00:00	\N	Sermons/Teachings	27	\N	2026-02-17 01:51:34.351316+00	digital	https://youtube.com/watch?v=parenting-faith	f
15	Midweek Worship Night	Live worship session every Wednesday. Unplug, tune in, and let the music carry you into God's presence.	2026-02-19 20:00:00	\N	Worship	25	\N	2026-02-17 01:51:34.527743+00	digital	https://youtube.com/live/midweek-worship	t
\.


--
-- Data for Name: guide_follows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guide_follows (id, follower_id, guide_id, created_at) FROM stdin;
\.


--
-- Data for Name: guide_post_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guide_post_likes (id, user_id, post_id, created_at) FROM stdin;
\.


--
-- Data for Name: guide_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guide_posts (id, user_id, title, content, post_type, scripture_ref, like_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: guide_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guide_reviews (id, guide_id, seeker_id, appointment_id, rating, review_text, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: guide_waitlist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guide_waitlist (id, guide_id, seeker_id, created_at, notified_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, sender_id, text, created_at) FROM stdin;
1	2	7	Hi Grace! I saw your profile and noticed you lead Bible studies. I have been wanting to get deeper into scripture.	2026-02-16 11:51:53.126+00
2	2	12	Hey Jordan! Welcome! I would love to help. Are you currently in a reading plan or just exploring on your own?	2026-02-16 13:51:53.126+00
3	2	7	Mostly on my own right now. I started the Gospel of John plan on the app but I have a lot of questions as I go.	2026-02-16 15:51:53.126+00
4	2	12	That is actually a great place to start. John really focuses on who Jesus is. What chapters are you on?	2026-02-16 17:51:53.126+00
5	2	7	Just finished chapter 3. The conversation with Nicodemus is so interesting but also confusing at parts.	2026-02-16 19:51:53.126+00
6	2	12	Born again is one of those phrases everyone uses but few understand in context! Would you want to meet up sometime this week to talk through it?	2026-02-16 21:51:53.126+00
7	2	7	That would be amazing, thank you! I am free most evenings.	2026-02-16 23:51:53.126+00
8	3	19	Hey Jordan! I just moved to Chicago and saw we go to the same church area. Do you know anyone at Willow Creek?	2026-02-16 13:51:53.896+00
9	3	7	Welcome to Chicago! I do not attend Willow Creek myself but Pastor Mike on here is great. He has been my guide for a while now.	2026-02-16 15:51:53.896+00
10	3	19	Nice, I have seen his profile. Chicago is a big change from where I came from. Trying to find my people you know?	2026-02-16 17:51:53.896+00
11	3	7	I totally get it. It took me a while too. Have you checked out the events on here? The prayer walk coming up is a good way to meet folks.	2026-02-16 19:51:53.896+00
12	3	19	Just RSVPd! Thanks for the tip. We should grab coffee sometime.	2026-02-16 21:51:53.896+00
13	3	7	For sure! There is a great spot on Michigan Ave. Let me know when you are free.	2026-02-16 23:51:53.896+00
14	4	7	Hi Sofia! I noticed we are both Catholic. How long have you been on Sanctuary?	2026-02-16 11:51:54.575+00
15	4	33	Hey Jordan! Just a few weeks. I am in Miami and honestly was looking for more faith-based community beyond just Sunday mass.	2026-02-16 13:51:54.575+00
16	4	7	Same! I grew up going to mass but felt like I wanted something more personal. This app has been great for that.	2026-02-16 15:51:54.575+00
17	4	33	That is exactly how I feel. The prayer board has been so encouraging. I posted about my dad's surgery and the support was overwhelming.	2026-02-16 17:51:54.575+00
18	4	7	I saw that and prayed for him! How is he doing?	2026-02-16 19:51:54.575+00
19	4	33	Surgery is next week. We are nervous but trusting God. Thank you for praying, it really means a lot.	2026-02-16 21:51:54.575+00
20	4	7	Of course. Keep us posted. Your family is in my prayers.	2026-02-16 23:51:54.575+00
21	5	8	Hi Jordan! Pastor Mike mentioned you might be interested in the worship team. Is that true?	2026-02-16 15:51:55.349+00
22	5	7	He did? Ha, I mentioned I used to play guitar but I am super rusty. I have not played in a worship setting in years.	2026-02-16 17:51:55.349+00
23	5	8	No pressure! We are very chill about it. A few of us meet on Thursdays to practice. You should come check it out.	2026-02-16 19:51:55.349+00
24	5	7	That actually sounds fun. I will dust off the guitar this weekend and see if my fingers still work lol.	2026-02-16 21:51:55.349+00
25	5	8	Haha trust me, we have all been there. I will send you the details for Thursday.	2026-02-16 23:51:55.349+00
26	6	13	Hey Mike! Saw your profile on here. Always good to connect with fellow pastors. How long have you been at Willow Creek?	2026-02-16 09:51:55.952+00
27	6	1	Thomas! Good to meet you brother. Going on 8 years now. I see you are out in Atlanta, how is ministry going down there?	2026-02-16 11:51:55.952+00
28	6	13	Blessed and busy. We just launched a marriage ministry that has been really impactful. Lots of couples coming in.	2026-02-16 13:51:55.952+00
29	6	1	That is awesome. Marriage and family is so needed right now. I have been thinking about starting something similar here.	2026-02-16 15:51:55.952+00
30	6	13	Happy to share what we have learned. We made some mistakes early on but found a good rhythm. Maybe we can set up a call?	2026-02-16 17:51:55.952+00
31	6	1	I would love that. Let me check my schedule and I will set up an appointment through the app.	2026-02-16 19:51:55.952+00
32	6	13	Sounds good! Also, your seeker Jordan seems really engaged. You are doing good work with him.	2026-02-16 21:51:55.952+00
33	6	1	He is great. Really hungry to learn and grow. Those are the ones that keep you going in ministry.	2026-02-16 23:51:55.952+00
34	7	1	Daniel! Welcome to the app. How is Nashville treating you?	2026-02-16 15:51:56.859+00
35	7	15	Mike! Nashville is wonderful. The music scene here really enriches our worship. How are things in Chicago?	2026-02-16 17:51:56.859+00
36	7	1	Cold but the community is warm haha. I saw you specialize in discipleship. That is something I want to get better at structuring.	2026-02-16 19:51:56.859+00
37	7	15	It is honestly my favorite part of ministry. One on one is where the real growth happens. Small groups are great but nothing beats personal investment.	2026-02-16 21:51:56.859+00
38	7	1	Amen to that. I have been doing more one on one sessions through this app and it is been really rewarding.	2026-02-16 23:51:56.859+00
39	8	30	Pastor Mike! I coach youth basketball here in Chicago and I have been wanting to find a way to integrate faith into my coaching. Any advice?	2026-02-16 11:51:57.484+00
40	8	1	Marcus, that is a great heart to have. Sports ministry is so powerful for reaching young people. What age group do you coach?	2026-02-16 13:51:57.484+00
41	8	30	High school, mostly 14 to 17. Some of these kids are dealing with a lot at home and basketball is their escape.	2026-02-16 15:51:57.484+00
42	8	1	I hear you. You do not have to make it overtly religious. Just being a consistent, caring adult in their lives IS ministry. Maybe start with a team devotional before games?	2026-02-16 17:51:57.484+00
43	8	30	I like that idea. Short and simple, nothing forced. A couple of the kids have actually asked me about faith on their own.	2026-02-16 19:51:57.484+00
44	8	1	That is the Holy Spirit at work brother. When they come to you, be ready. Would you want to set up a session to talk through some approaches?	2026-02-16 21:51:57.484+00
45	8	30	Absolutely. I will book something this week. Thank you Pastor Mike.	2026-02-16 23:51:57.484+00
46	9	29	Hi Pastor Mike! A friend recommended I connect with you. I am a nurse in Nashville and a mom of two, trying to find balance between work, family, and growing spiritually.	2026-02-16 13:51:58.299+00
47	9	1	Hi Olivia! That sounds like a lot on your plate. First off, the fact that you are even thinking about spiritual growth while juggling all that says a lot about your heart.	2026-02-16 15:51:58.299+00
48	9	29	Thank you, that means a lot. Some days I feel like I am failing at everything. I barely have time to read my Bible.	2026-02-16 17:51:58.299+00
49	9	1	Grace, not guilt. God sees your faithfulness in the small moments. Even a five minute prayer during your lunch break counts. Have you tried the reading plans on the app?	2026-02-16 19:51:58.299+00
50	9	29	I started the Psalms of Comfort one and it has been so good. Short enough that I can do it on my break.	2026-02-16 21:51:58.299+00
51	9	1	Perfect! Psalms is like a spiritual first aid kit. Keep at it and do not be hard on yourself. God meets us where we are, not where we think we should be.	2026-02-16 23:51:58.299+00
52	10	18	Pastor Mike, I have a question. I have been attending a non-denominational church but grew up in a traditional Korean church. Sometimes I feel caught between two worlds.	2026-02-16 15:51:59.007+00
53	10	1	That is actually more common than you think Rachel. A lot of people navigate between their cultural faith traditions and finding their own path. What feels different between the two?	2026-02-16 17:51:59.007+00
54	10	18	The Korean church was very structured and community focused. My current church is more relaxed but I miss the closeness.	2026-02-16 19:51:59.007+00
55	10	1	You do not have to choose one or the other. You can honor your roots while exploring what speaks to your heart now. Have you tried connecting with others from similar backgrounds on here?	2026-02-16 21:51:59.007+00
56	10	18	Not yet, but that is a good idea. I will look into it. Thank you for listening.	2026-02-16 23:51:59.007+00
57	11	22	Good morning Pastor Mike! I wanted to ask about volunteering. I feel called to serve but I am not sure where to start.	2026-02-16 13:51:59.597+00
58	11	1	Morning Aisha! I love that you are feeling that call. What are you passionate about? Sometimes our gifts point us to where we should serve.	2026-02-16 15:51:59.597+00
59	11	22	I love cooking and I have always wanted to do something with food, like a community meal program.	2026-02-16 17:51:59.597+00
60	11	1	There is actually a food drive coming up at Holy Name Cathedral. And we do a monthly potluck at Willow Creek. Both could be great starting points!	2026-02-16 19:51:59.597+00
61	11	22	I saw the potluck event! I already RSVPd. Maybe I can help organize the food for it?	2026-02-16 21:51:59.597+00
62	11	1	Absolutely, I will connect you with our events coordinator. Your gift of hospitality is going to bless a lot of people Aisha.	2026-02-16 23:51:59.597+00
63	12	32	Pastor Mike! I just got baptized last month and I am on fire for God but everyone keeps telling me it will fade. Is that true?	2026-02-16 15:52:00.28+00
64	12	1	Caleb! Congratulations on your baptism! That excitement is real and it is a gift. Will it look different in 6 months? Maybe. But that does not mean it fades, it matures.	2026-02-16 17:52:00.28+00
65	12	32	That is encouraging. I just want to make sure I keep growing. I signed up for the Gospel of John reading plan.	2026-02-16 19:52:00.28+00
66	12	1	Great choice. Here is my advice: surround yourself with people who challenge your faith. Stay in the Word daily even if it is just a few verses. And stay connected here. Community is everything.	2026-02-16 21:52:00.28+00
67	12	32	Will do. Thank you Pastor Mike. This app has been such a blessing.	2026-02-16 23:52:00.28+00
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notes (id, user_id, title, content, tags, created_at, updated_at, appointment_id) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, actor_id, type, title, body, reference_type, reference_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_resets (id, user_id, code_hash, method, expires_at, used, attempts, locked_until, created_at) FROM stdin;
\.


--
-- Data for Name: prayer_interactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prayer_interactions (id, user_id, request_id, type, comment_text, created_at) FROM stdin;
1	7	1	prayed	\N	2026-02-17 01:51:46.10978+00
2	1	1	prayed	\N	2026-02-17 01:51:46.197407+00
3	8	1	prayed	\N	2026-02-17 01:51:46.285762+00
4	1	2	prayed	\N	2026-02-17 01:51:46.376329+00
5	8	2	prayed	\N	2026-02-17 01:51:46.468589+00
6	9	2	prayed	\N	2026-02-17 01:51:46.563176+00
7	10	2	prayed	\N	2026-02-17 01:51:46.657771+00
8	8	3	prayed	\N	2026-02-17 01:51:46.745074+00
9	9	3	prayed	\N	2026-02-17 01:51:46.846024+00
10	10	3	prayed	\N	2026-02-17 01:51:46.942486+00
11	11	3	prayed	\N	2026-02-17 01:51:47.027842+00
12	12	3	prayed	\N	2026-02-17 01:51:47.11515+00
13	9	4	prayed	\N	2026-02-17 01:51:47.206823+00
14	10	4	prayed	\N	2026-02-17 01:51:47.292646+00
15	11	4	prayed	\N	2026-02-17 01:51:47.37747+00
16	12	4	prayed	\N	2026-02-17 01:51:47.461127+00
17	13	4	prayed	\N	2026-02-17 01:51:47.544425+00
18	14	4	prayed	\N	2026-02-17 01:51:47.628519+00
19	10	5	prayed	\N	2026-02-17 01:51:47.717756+00
20	11	5	prayed	\N	2026-02-17 01:51:47.803484+00
21	12	5	prayed	\N	2026-02-17 01:51:47.889624+00
22	13	5	prayed	\N	2026-02-17 01:51:48.032208+00
23	14	5	prayed	\N	2026-02-17 01:51:48.117285+00
24	15	5	prayed	\N	2026-02-17 01:51:48.260034+00
25	16	5	prayed	\N	2026-02-17 01:51:48.403755+00
26	11	6	prayed	\N	2026-02-17 01:51:48.500591+00
27	12	6	prayed	\N	2026-02-17 01:51:48.600346+00
28	13	6	prayed	\N	2026-02-17 01:51:48.68721+00
29	14	6	prayed	\N	2026-02-17 01:51:48.773293+00
30	15	6	prayed	\N	2026-02-17 01:51:48.857583+00
31	16	6	prayed	\N	2026-02-17 01:51:48.943286+00
32	17	6	prayed	\N	2026-02-17 01:51:49.033627+00
33	18	6	prayed	\N	2026-02-17 01:51:49.117002+00
34	12	7	prayed	\N	2026-02-17 01:51:49.200853+00
35	13	7	prayed	\N	2026-02-17 01:51:49.284158+00
36	14	7	prayed	\N	2026-02-17 01:51:49.369398+00
37	13	8	prayed	\N	2026-02-17 01:51:49.453006+00
38	14	8	prayed	\N	2026-02-17 01:51:49.537052+00
39	15	8	prayed	\N	2026-02-17 01:51:49.621104+00
40	16	8	prayed	\N	2026-02-17 01:51:49.704522+00
41	14	9	prayed	\N	2026-02-17 01:51:49.793556+00
42	15	9	prayed	\N	2026-02-17 01:51:49.877811+00
43	16	9	prayed	\N	2026-02-17 01:51:49.962009+00
44	17	9	prayed	\N	2026-02-17 01:51:50.046633+00
45	18	9	prayed	\N	2026-02-17 01:51:50.146183+00
46	15	10	prayed	\N	2026-02-17 01:51:50.237224+00
47	16	10	prayed	\N	2026-02-17 01:51:50.323504+00
48	17	10	prayed	\N	2026-02-17 01:51:50.408226+00
49	18	10	prayed	\N	2026-02-17 01:51:50.492066+00
50	19	10	prayed	\N	2026-02-17 01:51:50.576065+00
51	20	10	prayed	\N	2026-02-17 01:51:50.661098+00
52	16	11	prayed	\N	2026-02-17 01:51:50.746437+00
53	17	11	prayed	\N	2026-02-17 01:51:50.830625+00
54	18	11	prayed	\N	2026-02-17 01:51:50.914568+00
55	19	11	prayed	\N	2026-02-17 01:51:50.998726+00
56	20	11	prayed	\N	2026-02-17 01:51:51.082802+00
57	21	11	prayed	\N	2026-02-17 01:51:51.169529+00
58	22	11	prayed	\N	2026-02-17 01:51:51.252781+00
59	17	12	prayed	\N	2026-02-17 01:51:51.337315+00
60	18	12	prayed	\N	2026-02-17 01:51:51.4211+00
61	19	12	prayed	\N	2026-02-17 01:51:51.505231+00
62	20	12	prayed	\N	2026-02-17 01:51:51.589725+00
63	21	12	prayed	\N	2026-02-17 01:51:51.676997+00
64	22	12	prayed	\N	2026-02-17 01:51:51.76088+00
65	23	12	prayed	\N	2026-02-17 01:51:51.844434+00
66	24	12	prayed	\N	2026-02-17 01:51:51.930231+00
67	18	13	prayed	\N	2026-02-17 01:51:52.014215+00
68	19	13	prayed	\N	2026-02-17 01:51:52.099544+00
69	20	13	prayed	\N	2026-02-17 01:51:52.185721+00
70	19	14	prayed	\N	2026-02-17 01:51:52.270246+00
71	20	14	prayed	\N	2026-02-17 01:51:52.35451+00
72	21	14	prayed	\N	2026-02-17 01:51:52.437764+00
73	22	14	prayed	\N	2026-02-17 01:51:52.522173+00
\.


--
-- Data for Name: prayer_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prayer_requests (id, user_id, title, description, category, is_anonymous, prayer_count, status, created_at, updated_at, type, linked_prayer_id) FROM stdin;
1	8	God answered my prayer for healing!	After months of treatment and prayer from this community, I am officially in remission. Thank you all for your prayers and support. God is faithful!	Gratitude	f	0	active	2026-02-17 01:51:44.500117+00	2026-02-17 01:51:44.500117+00	testimony	\N
2	7	New job after months of searching	I posted a prayer request here 3 months ago about finding employment. I am happy to share that I received an offer this week for my dream position. Never stop praying!	Gratitude	f	0	active	2026-02-17 01:51:44.587337+00	2026-02-17 01:51:44.587337+00	testimony	\N
3	29	My marriage was restored!	My husband and I were on the brink of divorce. Through counseling with our pastor and the prayers of this community, we recommitted to each other. God is a God of restoration!	Gratitude	f	0	active	2026-02-17 01:51:44.678546+00	2026-02-17 01:51:44.678546+00	testimony	\N
4	32	Baptized last Sunday!	After two years of searching, I finally gave my life to Christ and was baptized at my church. Thank you to everyone who walked this journey with me.	Gratitude	f	0	active	2026-02-17 01:51:44.769756+00	2026-02-17 01:51:44.769756+00	testimony	\N
5	34	Addiction-free for one year	One year sober today. I could not have done it without faith, my small group, and the constant prayers from this community. If you are struggling, please reach out.	Gratitude	f	0	active	2026-02-17 01:51:44.86185+00	2026-02-17 01:51:44.86185+00	testimony	\N
6	39	Daughter accepted to college!	We have been praying for my daughter's future for years. She just received a full scholarship to study nursing. God provides!	Gratitude	f	0	active	2026-02-17 01:51:44.963611+00	2026-02-17 01:51:44.963611+00	testimony	\N
7	33	Prayers for my father's surgery	My dad is having heart surgery next Tuesday. Please pray for a successful operation and a smooth recovery. He is 72 and means the world to our family.	Health	f	0	active	2026-02-17 01:51:45.075587+00	2026-02-17 01:51:45.075587+00	prayer	\N
8	31	Struggling with anxiety	I have been dealing with severe anxiety lately and it is affecting my work and relationships. Please pray for peace and clarity.	Health	f	0	active	2026-02-17 01:51:45.197841+00	2026-02-17 01:51:45.197841+00	prayer	\N
9	30	Pray for my marriage	My wife and I are going through a rough season. We love each other but communication has broken down. Please lift us up.	Family	f	0	active	2026-02-17 01:51:45.295103+00	2026-02-17 01:51:45.295103+00	prayer	\N
10	38	Job interview this Friday	I have a big job interview coming up. I have been unemployed for 4 months and really need this to work out. Praying for favor and confidence.	Financial	f	0	active	2026-02-17 01:51:45.393893+00	2026-02-17 01:51:45.393893+00	prayer	\N
11	35	Guidance for a big decision	I am trying to decide whether to move across the country for a new opportunity or stay close to family. Please pray for wisdom and discernment.	Guidance	f	0	active	2026-02-17 01:51:45.481577+00	2026-02-17 01:51:45.481577+00	prayer	\N
12	1	Please pray for my son	My teenage son has been pulling away from faith and making some concerning choices. Praying he finds his way back.	Family	f	0	active	2026-02-17 01:51:45.588099+00	2026-02-17 01:51:45.588099+00	prayer	\N
13	37	Healing from grief	I lost my grandmother last month and the grief has been overwhelming. She was my rock. Please pray for comfort and strength.	Health	f	0	active	2026-02-17 01:51:45.821093+00	2026-02-17 01:51:45.821093+00	prayer	\N
14	40	Struggling with faith	I have been going through a season of doubt. I want to believe but everything feels distant. Please pray I find my way through this.	Other	f	0	active	2026-02-17 01:51:45.920756+00	2026-02-17 01:51:45.920756+00	prayer	\N
\.


--
-- Data for Name: reading_plan_days; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reading_plan_days (id, plan_id, day_number, title, reference) FROM stdin;
1	1	1	John 1	John 1:1-end
2	1	2	John 2	John 2:1-end
3	1	3	John 3	John 3:1-end
4	1	4	John 4	John 4:1-end
5	1	5	John 5	John 5:1-end
6	1	6	John 6	John 6:1-end
7	1	7	John 7	John 7:1-end
8	1	8	John 8	John 8:1-end
9	1	9	John 9	John 9:1-end
10	1	10	John 10	John 10:1-end
11	1	11	John 11	John 11:1-end
12	1	12	John 12	John 12:1-end
13	1	13	John 13	John 13:1-end
14	1	14	John 14	John 14:1-end
15	1	15	John 15	John 15:1-end
16	1	16	John 16	John 16:1-end
17	1	17	John 17	John 17:1-end
18	1	18	John 18	John 18:1-end
19	1	19	John 19	John 19:1-end
20	1	20	John 20	John 20:1-end
21	1	21	John 21	John 21:1-end
22	2	1	The Good Shepherd	Psalm 23
23	2	2	God Our Refuge	Psalm 46
24	2	3	Under His Wings	Psalm 91
25	2	4	My Help Comes from the Lord	Psalm 121
26	2	5	Fearfully and Wonderfully Made	Psalm 139
27	2	6	The Lord is My Light	Psalm 27
28	2	7	My Soul Finds Rest	Psalm 62
29	3	1	Proverbs 1	Proverbs 1:1-end
30	3	2	Proverbs 2	Proverbs 2:1-end
31	3	3	Proverbs 3	Proverbs 3:1-end
32	3	4	Proverbs 4	Proverbs 4:1-end
33	3	5	Proverbs 5	Proverbs 5:1-end
34	3	6	Proverbs 6	Proverbs 6:1-end
35	3	7	Proverbs 7	Proverbs 7:1-end
36	3	8	Proverbs 8	Proverbs 8:1-end
37	3	9	Proverbs 9	Proverbs 9:1-end
38	3	10	Proverbs 10	Proverbs 10:1-end
39	3	11	Proverbs 11	Proverbs 11:1-end
40	3	12	Proverbs 12	Proverbs 12:1-end
41	3	13	Proverbs 13	Proverbs 13:1-end
42	3	14	Proverbs 14	Proverbs 14:1-end
43	3	15	Proverbs 15	Proverbs 15:1-end
44	3	16	Proverbs 16	Proverbs 16:1-end
45	3	17	Proverbs 17	Proverbs 17:1-end
46	3	18	Proverbs 18	Proverbs 18:1-end
47	3	19	Proverbs 19	Proverbs 19:1-end
48	3	20	Proverbs 20	Proverbs 20:1-end
49	3	21	Proverbs 21	Proverbs 21:1-end
50	3	22	Proverbs 22	Proverbs 22:1-end
51	3	23	Proverbs 23	Proverbs 23:1-end
52	3	24	Proverbs 24	Proverbs 24:1-end
53	3	25	Proverbs 25	Proverbs 25:1-end
54	3	26	Proverbs 26	Proverbs 26:1-end
55	3	27	Proverbs 27	Proverbs 27:1-end
56	3	28	Proverbs 28	Proverbs 28:1-end
57	3	29	Proverbs 29	Proverbs 29:1-end
58	3	30	Proverbs 30	Proverbs 30:1-end
59	3	31	Proverbs 31	Proverbs 31:1-end
\.


--
-- Data for Name: reading_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reading_plans (id, name, description, total_days, created_by, created_at, church_account_id) FROM stdin;
1	Gospel of John - 21 Days	Journey through the Gospel of John, discovering the life and teachings of Jesus Christ.	21	\N	2026-02-16 03:29:09.809324+00	\N
2	Psalms of Comfort - 7 Days	A week of comforting psalms to bring peace and strength to your spirit.	7	\N	2026-02-16 03:29:09.809324+00	\N
3	Proverbs Wisdom - 31 Days	Read one chapter of Proverbs each day for a month of practical wisdom.	31	\N	2026-02-16 03:29:09.809324+00	\N
\.


--
-- Data for Name: scripture_verses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scripture_verses (id, text, reference, category) FROM stdin;
31	For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.	John 3:16	Love
32	Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.	1 Corinthians 13:4-7	Love
33	We love because he first loved us.	1 John 4:19	Love
34	But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.	Romans 5:8	Love
35	Greater love has no one than this: to lay down one's life for one's friends.	John 15:13	Love
36	I can do all things through Christ who strengthens me.	Philippians 4:13	Strength
37	But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.	Isaiah 40:31	Strength
38	For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.	2 Timothy 1:7	Strength
39	Finally, be strong in the Lord and in his mighty power.	Ephesians 6:10	Strength
40	It is God who arms me with strength and keeps my way secure.	Psalm 18:32	Strength
41	For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.	Jeremiah 29:11	Hope
42	And we know that in all things God works for the good of those who love him, who have been called according to his purpose.	Romans 8:28	Hope
43	May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.	Romans 15:13	Hope
44	Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.	Lamentations 3:22-23	Hope
45	Now faith is confidence in what we hope for and assurance about what we do not see.	Hebrews 11:1	Hope
46	The Lord is my shepherd, I lack nothing.	Psalm 23:1	Comfort
47	God is our refuge and strength, an ever-present help in trouble.	Psalm 46:1	Comfort
48	Come to me, all you who are weary and burdened, and I will give you rest.	Matthew 11:28	Comfort
49	Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.	2 Corinthians 1:3-4	Comfort
50	The Lord is close to the brokenhearted and saves those who are crushed in spirit.	Psalm 34:18	Comfort
51	Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.	Proverbs 3:5-6	Trust
52	When I am afraid, I put my trust in you.	Psalm 56:3	Trust
53	Commit your way to the Lord; trust in him and he will do this.	Psalm 37:5	Trust
54	You will keep in perfect peace those whose minds are steadfast, because they trust in you.	Isaiah 26:3	Trust
55	The Lord is good, a refuge in times of trouble. He cares for those who trust in him.	Nahum 1:7	Trust
56	Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.	Joshua 1:9	Courage
57	Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.	Deuteronomy 31:6	Courage
58	So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.	Isaiah 41:10	Courage
59	The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?	Psalm 27:1	Courage
60	Be strong and courageous, and do the work. Do not be afraid or discouraged, for the Lord God, my God, is with you.	1 Chronicles 28:20	Courage
61	So then faith comes by hearing, and hearing by the word of God.	Romans 10:17	Faith
62	If you have faith as small as a mustard seed, you can say to this mountain, Move from here to there, and it will move. Nothing will be impossible for you.	Matthew 17:20	Faith
63	I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.	Galatians 2:20	Faith
64	And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.	Hebrews 11:6	Faith
65	Have faith in God. Truly I tell you, if anyone says to this mountain, Go, throw yourself into the sea, and does not doubt in their heart but believes that what they say will happen, it will be done for them.	Mark 11:22-24	Faith
66	Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.	Philippians 4:6-7	Peace
67	Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.	John 14:27	Peace
68	In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.	Psalm 4:8	Peace
69	Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful.	Colossians 3:15	Peace
70	The mind governed by the flesh is death, but the mind governed by the Spirit is life and peace.	Romans 8:6	Peace
71	Give thanks in all circumstances; for this is God's will for you in Christ Jesus.	1 Thessalonians 5:18	Gratitude
72	Give thanks to the Lord, for he is good; his love endures forever.	Psalm 107:1	Gratitude
73	And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.	Colossians 3:17	Gratitude
74	Always giving thanks to God the Father for everything, in the name of our Lord Jesus Christ.	Ephesians 5:20	Gratitude
75	Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.	Psalm 100:4	Gratitude
76	For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.	Romans 8:38-39	Love
77	The Lord is my strength and my shield; my heart trusts in him, and he helps me. My heart leaps for joy, and with my song I praise him.	Psalm 28:7	Strength
78	Be strong and take heart, all you who hope in the Lord.	Psalm 31:24	Hope
79	Cast all your anxiety on him because he cares for you.	1 Peter 5:7	Comfort
80	I will say of the Lord, He is my refuge and my fortress, my God, in whom I trust.	Psalm 91:2	Trust
81	The Lord is with me; I will not be afraid. What can mere mortals do to me?	Psalm 118:6	Courage
\.


--
-- Data for Name: user_bible_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_bible_bookmarks (id, user_id, book, chapter, verse, note, created_at) FROM stdin;
\.


--
-- Data for Name: user_bible_highlights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_bible_highlights (id, user_id, book, chapter, verse, color, created_at) FROM stdin;
\.


--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_blocks (id, blocker_id, blocked_id, created_at) FROM stdin;
\.


--
-- Data for Name: user_connections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_connections (id, requester_id, recipient_id, status, created_at, updated_at) FROM stdin;
6	9	1	pending	2026-02-17 01:51:27.867729+00	2026-02-17 01:51:27.867729+00
7	1	8	accepted	2026-02-17 01:51:27.956899+00	2026-02-17 01:51:27.956899+00
8	1	10	accepted	2026-02-17 01:51:28.04714+00	2026-02-17 01:51:28.04714+00
9	1	11	accepted	2026-02-17 01:51:28.147712+00	2026-02-17 01:51:28.147712+00
10	1	12	accepted	2026-02-17 01:51:28.236386+00	2026-02-17 01:51:28.236386+00
11	7	1	accepted	2026-02-17 01:51:28.324553+00	2026-02-17 01:51:28.324553+00
12	7	12	accepted	2026-02-17 01:51:28.412044+00	2026-02-17 01:51:28.412044+00
13	7	24	accepted	2026-02-17 01:51:28.498729+00	2026-02-17 01:51:28.498729+00
14	7	25	accepted	2026-02-17 01:51:28.586813+00	2026-02-17 01:51:28.586813+00
15	7	8	accepted	2026-02-17 01:51:28.671846+00	2026-02-17 01:51:28.671846+00
16	7	19	accepted	2026-02-17 01:51:28.759817+00	2026-02-17 01:51:28.759817+00
17	7	32	accepted	2026-02-17 01:51:28.843934+00	2026-02-17 01:51:28.843934+00
18	7	33	accepted	2026-02-17 01:51:28.932982+00	2026-02-17 01:51:28.932982+00
19	7	30	accepted	2026-02-17 01:51:29.036364+00	2026-02-17 01:51:29.036364+00
20	7	29	accepted	2026-02-17 01:51:29.128068+00	2026-02-17 01:51:29.128068+00
21	7	42	accepted	2026-02-17 01:51:29.225861+00	2026-02-17 01:51:29.225861+00
22	1	13	accepted	2026-02-17 01:51:29.345425+00	2026-02-17 01:51:29.345425+00
23	1	15	accepted	2026-02-17 01:51:29.440434+00	2026-02-17 01:51:29.440434+00
24	1	29	accepted	2026-02-17 01:51:29.524946+00	2026-02-17 01:51:29.524946+00
25	1	19	accepted	2026-02-17 01:51:29.611632+00	2026-02-17 01:51:29.611632+00
26	1	18	accepted	2026-02-17 01:51:29.695881+00	2026-02-17 01:51:29.695881+00
27	1	22	accepted	2026-02-17 01:51:29.787621+00	2026-02-17 01:51:29.787621+00
28	1	32	accepted	2026-02-17 01:51:29.872995+00	2026-02-17 01:51:29.872995+00
29	1	30	accepted	2026-02-17 01:51:29.961859+00	2026-02-17 01:51:29.961859+00
30	24	36	accepted	2026-02-17 01:51:30.049647+00	2026-02-17 01:51:30.049647+00
31	25	36	accepted	2026-02-17 01:51:30.13326+00	2026-02-17 01:51:30.13326+00
32	27	31	accepted	2026-02-17 01:51:30.223934+00	2026-02-17 01:51:30.223934+00
33	27	35	accepted	2026-02-17 01:51:30.312007+00	2026-02-17 01:51:30.312007+00
34	27	43	accepted	2026-02-17 01:51:30.402732+00	2026-02-17 01:51:30.402732+00
35	28	33	accepted	2026-02-17 01:51:30.496745+00	2026-02-17 01:51:30.496745+00
36	26	40	accepted	2026-02-17 01:51:30.586173+00	2026-02-17 01:51:30.586173+00
37	41	34	accepted	2026-02-17 01:51:30.673103+00	2026-02-17 01:51:30.673103+00
38	41	32	accepted	2026-02-17 01:51:30.758974+00	2026-02-17 01:51:30.758974+00
39	30	19	accepted	2026-02-17 01:51:30.847739+00	2026-02-17 01:51:30.847739+00
40	39	22	accepted	2026-02-17 01:51:30.934791+00	2026-02-17 01:51:30.934791+00
41	38	21	accepted	2026-02-17 01:51:31.020997+00	2026-02-17 01:51:31.020997+00
42	37	20	accepted	2026-02-17 01:51:31.111627+00	2026-02-17 01:51:31.111627+00
43	34	32	accepted	2026-02-17 01:51:31.206107+00	2026-02-17 01:51:31.206107+00
44	33	10	accepted	2026-02-17 01:51:31.301128+00	2026-02-17 01:51:31.301128+00
45	31	12	accepted	2026-02-17 01:51:31.418322+00	2026-02-17 01:51:31.418322+00
46	40	43	accepted	2026-02-17 01:51:31.520914+00	2026-02-17 01:51:31.520914+00
47	42	18	accepted	2026-02-17 01:51:31.613389+00	2026-02-17 01:51:31.613389+00
\.


--
-- Data for Name: user_memorization_stats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_memorization_stats (id, user_id, verse_id, mode, attempts, correct_count, last_practiced) FROM stdin;
\.


--
-- Data for Name: user_reading_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_reading_progress (id, user_id, plan_id, completed_days, started_at) FROM stdin;
\.


--
-- Data for Name: user_study_streaks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_study_streaks (id, user_id, current_streak, longest_streak, last_study_date) FROM stdin;
\.


--
-- Data for Name: user_verse_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_verse_bookmarks (id, user_id, verse_id, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, avatar, photo_url, role, bio, specialization, location, denomination, church_name, interests, created_at, updated_at, state, city, preferred_church_id, accepting_seekers, max_pending_requests, onboarding_completed, phone_number, follower_count, overall_rating, review_count) FROM stdin;
1	Pastor Mike	test@sanctuary.com	$2b$10$ipueqjWCiXNWZq.YYv12l.ef09hOyN7HUt4oCAcSGOAuSxrOYnMC2	🙏	\N	guide	Spiritual guide dedicated to helping others find their path through prayer and scripture.	General Guidance	Atlanta, GA	Non-denominational	Willow Creek Church	{"Bible Study",Worship,"Youth Ministry",Volunteering}	2026-02-08 03:07:34.710821+00	2026-02-08 03:07:34.710821+00	IL	Chicago	\N	t	5	t	\N	0	0.00	0
7	Jordan Rivera	jordan@sanctuary.com	$2b$10$Gm6HSYXwNCsOTdV1pnFdCuiraqvFL/A1qgMMof9Ql.TLl5hw6ZpdS	🙏	https://randomuser.me/api/portraits/men/85.jpg	seeker	\N	\N	Chicago, IL	Catholic	\N	{Hiking,Sports,Reading,Travel,"Community Service"}	2026-02-16 02:50:39.100795+00	2026-02-16 02:50:39.100795+00	IL	Chicago	\N	t	5	t	\N	0	0.00	0
8	Sarah Johnson	sarah.johnson@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/44.jpg	seeker	\N	\N	\N	Baptist	Holy Name Cathedral	{Reading,Music,"Bible Study"}	2026-02-17 01:51:24.371731+00	2026-02-17 01:51:24.371731+00	\N	\N	\N	t	5	t	\N	0	0.00	0
9	Michael Chen	michael.chen@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/75.jpg	seeker	\N	\N	\N	Methodist	\N	{Hiking,Photography,"Community Service"}	2026-02-17 01:51:24.462263+00	2026-02-17 01:51:24.462263+00	\N	\N	\N	t	5	t	\N	0	0.00	0
10	Emily Rodriguez	emily.rodriguez@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩‍🦱	https://randomuser.me/api/portraits/women/63.jpg	seeker	\N	\N	\N	Catholic	New Life Assembly	{Painting,Worship,Cooking}	2026-02-17 01:51:24.549796+00	2026-02-17 01:51:24.549796+00	\N	\N	\N	t	5	t	\N	0	0.00	0
11	James Wilson	james.wilson@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨‍🦳	https://randomuser.me/api/portraits/men/52.jpg	seeker	\N	\N	\N	Presbyterian	\N	{Sports,Gardening,Travel}	2026-02-17 01:51:24.641923+00	2026-02-17 01:51:24.641923+00	\N	\N	\N	t	5	t	\N	0	0.00	0
12	Grace Okafor	grace.okafor@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/25.jpg	guide	\N	\N	\N	Pentecostal	Faith Community Church	{"Bible Study","Youth Ministry",Writing,Music}	2026-02-17 01:51:24.734194+00	2026-02-17 01:51:24.734194+00	\N	\N	\N	t	5	t	\N	0	0.00	0
13	Pastor Thomas Wright	pastor.thomas.wright@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨‍🦱	https://randomuser.me/api/portraits/men/41.jpg	guide	Senior pastor with 15 years leading a vibrant congregation in Atlanta.	Marriage & Family	Atlanta, GA	Baptist	Lakewood Church	{"Bible Study",Counseling,"Community Service",Music}	2026-02-17 01:51:24.849289+00	2026-02-17 01:51:24.849289+00	GA	Atlanta	\N	t	8	t	\N	0	0.00	0
14	Rev. Angela Pierce	rev..angela.pierce@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩‍🦱	https://randomuser.me/api/portraits/women/37.jpg	guide	Associate minister focused on women's ministry and spiritual wellness.	Women's Ministry	Los Angeles, CA	AME	\N	{Worship,Writing,Counseling,Volunteering}	2026-02-17 01:51:24.933424+00	2026-02-17 01:51:24.933424+00	CA	Los Angeles	\N	t	5	t	\N	0	0.00	0
15	Pastor Daniel Reeves	pastor.daniel.reeves@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	🧔	https://randomuser.me/api/portraits/men/22.jpg	guide	Passionate about discipleship and helping new believers grow in their faith.	Discipleship	Nashville, TN	Methodist	Brooklyn Tabernacle	{"Bible Study",Music,Hiking,"Youth Ministry"}	2026-02-17 01:51:25.02178+00	2026-02-17 01:51:25.02178+00	TN	Nashville	\N	t	4	t	\N	0	0.00	0
16	Sister Catherine Tran	sister.catherine.tran@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/51.jpg	guide	Contemplative prayer guide and retreat facilitator for over a decade.	Prayer & Meditation	Seattle, WA	Catholic	Holy Name Cathedral	{Reading,Painting,"Bible Study",Worship}	2026-02-17 01:51:25.108586+00	2026-02-17 01:51:25.108586+00	WA	Seattle	\N	t	6	t	\N	0	0.00	0
17	Elder Marcus Thompson	elder.marcus.thompson@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨‍🦳	https://randomuser.me/api/portraits/men/67.jpg	guide	Church elder and mentor with a heart for young men finding their purpose.	Men's Ministry	Brooklyn, NY	Pentecostal	Brooklyn Tabernacle	{Sports,"Community Service","Bible Study",Volunteering}	2026-02-17 01:51:25.205885+00	2026-02-17 01:51:25.205885+00	NY	Brooklyn	\N	t	10	t	\N	0	0.00	0
18	Rachel Kim	rachel.kim@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/15.jpg	seeker	\N	\N	Houston, TX	Non-denominational	Lakewood Church	{Music,Cooking,"Bible Study",Travel}	2026-02-17 01:51:25.292894+00	2026-02-17 01:51:25.292894+00	TX	Houston	\N	t	5	t	\N	0	0.00	0
19	Nathan Brooks	nathan.brooks@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/45.jpg	seeker	Recently moved to Chicago and looking for a faith community.	\N	Chicago, IL	Baptist	Willow Creek Church	{Sports,Photography,"Community Service"}	2026-02-17 01:51:25.381825+00	2026-02-17 01:51:25.381825+00	IL	Chicago	\N	t	5	t	\N	0	0.00	0
20	Priya Sharma	priya.sharma@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩‍🦱	https://randomuser.me/api/portraits/women/82.jpg	seeker	\N	\N	San Francisco, CA	Non-denominational	\N	{Reading,Hiking,Worship,Writing}	2026-02-17 01:51:25.478275+00	2026-02-17 01:51:25.478275+00	CA	San Francisco	\N	t	5	t	\N	0	0.00	0
21	Tyler Odom	tyler.odom@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👦	https://randomuser.me/api/portraits/men/11.jpg	seeker	College junior studying theology and exploring different denominations.	\N	Orlando, FL	Methodist	\N	{Hiking,Music,"Youth Ministry",Gardening}	2026-02-17 01:51:25.567076+00	2026-02-17 01:51:25.567076+00	FL	Orlando	\N	t	5	t	\N	0	0.00	0
22	Aisha Williams	aisha.williams@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩‍🦱	https://randomuser.me/api/portraits/women/33.jpg	seeker	\N	\N	Atlanta, GA	Baptist	\N	{Volunteering,Cooking,Worship,"Community Service"}	2026-02-17 01:51:25.657402+00	2026-02-17 01:51:25.657402+00	GA	Atlanta	\N	t	5	t	\N	0	0.00	0
23	Chris Martinez	chris.martinez@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/91.jpg	seeker	\N	\N	Phoenix, AZ	Catholic	\N	{Sports,Travel,Photography,Reading}	2026-02-17 01:51:25.751052+00	2026-02-17 01:51:25.751052+00	AZ	Phoenix	\N	t	5	t	\N	0	0.00	0
24	Pastor Robert Hayes	pastor.robert.hayes@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨‍🦱	https://randomuser.me/api/portraits/men/55.jpg	guide	Former chaplain now pastoring a growing church in Houston. Specializes in grief and loss counseling.	Grief & Recovery	Houston, TX	Baptist	Lakewood Church	{Counseling,"Bible Study","Community Service",Writing}	2026-02-17 01:51:25.870728+00	2026-02-17 01:51:25.870728+00	TX	Houston	\N	t	6	t	\N	0	0.00	0
25	Minister Joy Adebayo	minister.joy.adebayo@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/72.jpg	guide	Worship leader and spiritual mentor passionate about helping people find their voice in faith.	Worship & Creative Arts	Dallas, TX	Non-denominational	\N	{Music,Worship,"Youth Ministry",Painting}	2026-02-17 01:51:25.96239+00	2026-02-17 01:51:25.96239+00	TX	Dallas	\N	t	7	t	\N	0	0.00	0
26	Rev. Samuel Kim	rev..samuel.kim@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/36.jpg	guide	Bilingual pastor serving multicultural congregations for over 12 years.	Multicultural Ministry	Seattle, WA	Presbyterian	\N	{"Bible Study",Travel,Reading,"Community Service"}	2026-02-17 01:51:26.053989+00	2026-02-17 01:51:26.053989+00	WA	Seattle	\N	t	5	t	\N	0	0.00	0
27	Pastor Lisa Monroe	pastor.lisa.monroe@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩‍🦱	https://randomuser.me/api/portraits/women/42.jpg	guide	College campus minister who loves walking with young adults through big life transitions.	Young Adult Ministry	Minneapolis, MN	Lutheran	\N	{Hiking,Counseling,Writing,"Bible Study"}	2026-02-17 01:51:26.138479+00	2026-02-17 01:51:26.138479+00	MN	Minneapolis	\N	t	8	t	\N	0	0.00	0
28	Deacon Carlos Vega	deacon.carlos.vega@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/18.jpg	guide	Bilingual deacon with a heart for immigrant families and faith formation.	Family Ministry	San Antonio, TX	Catholic	\N	{Volunteering,"Community Service",Sports,Cooking}	2026-02-17 01:51:26.237726+00	2026-02-17 01:51:26.237726+00	TX	San Antonio	\N	t	4	t	\N	0	0.00	0
29	Olivia Bennett	olivia.bennett@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/20.jpg	seeker	Nurse and mom of two, looking for deeper community and spiritual growth.	\N	Nashville, TN	Methodist	\N	{Reading,Cooking,Worship,Volunteering}	2026-02-17 01:51:26.333724+00	2026-02-17 01:51:26.333724+00	TN	Nashville	\N	t	5	t	\N	0	0.00	0
30	Marcus Davis	marcus.davis@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/34.jpg	seeker	Youth basketball coach seeking mentorship in faith leadership.	\N	Chicago, IL	Baptist	Willow Creek Church	{Sports,"Youth Ministry",Music,"Community Service"}	2026-02-17 01:51:26.426759+00	2026-02-17 01:51:26.426759+00	IL	Chicago	\N	t	5	t	\N	0	0.00	0
31	Hannah Lee	hannah.lee@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/55.jpg	seeker	Grad student exploring how faith intersects with social justice.	\N	Portland, OR	Non-denominational	\N	{Reading,Hiking,Writing,Volunteering}	2026-02-17 01:51:26.510421+00	2026-02-17 01:51:26.510421+00	OR	Portland	\N	t	5	t	\N	0	0.00	0
32	Caleb Washington	caleb.washington@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/14.jpg	seeker	Recently baptized and excited to grow in my walk with Christ.	\N	Atlanta, GA	Pentecostal	\N	{Music,Sports,"Bible Study",Travel}	2026-02-17 01:51:26.597741+00	2026-02-17 01:51:26.597741+00	GA	Atlanta	\N	t	5	t	\N	0	0.00	0
33	Sofia Ramirez	sofia.ramirez@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩‍🦱	https://randomuser.me/api/portraits/women/47.jpg	seeker	Bilingual teacher passionate about integrating faith and education.	\N	Miami, FL	Catholic	\N	{Reading,Cooking,"Community Service",Music}	2026-02-17 01:51:26.68673+00	2026-02-17 01:51:26.68673+00	FL	Miami	\N	t	5	t	\N	0	0.00	0
34	Elijah Brown	elijah.brown@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/62.jpg	seeker	Retired military, finding peace and purpose through faith.	\N	Charlotte, NC	AME	\N	{Hiking,Gardening,"Bible Study",Volunteering}	2026-02-17 01:51:26.7733+00	2026-02-17 01:51:26.7733+00	NC	Charlotte	\N	t	5	t	\N	0	0.00	0
35	Megan O'Brien	megan.o'brien@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/28.jpg	seeker	Freelance designer who just moved to Denver and looking for a church home.	\N	Denver, CO	Lutheran	\N	{Painting,Photography,Worship,Hiking}	2026-02-17 01:51:26.872913+00	2026-02-17 01:51:26.872913+00	CO	Denver	\N	t	5	t	\N	0	0.00	0
36	Isaiah Reed	isaiah.reed@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/8.jpg	seeker	High school music teacher exploring how to lead worship at my church.	\N	Dallas, TX	Baptist	\N	{Music,Worship,"Youth Ministry",Sports}	2026-02-17 01:51:26.970999+00	2026-02-17 01:51:26.970999+00	TX	Dallas	\N	t	5	t	\N	0	0.00	0
37	Zoe Nakamura	zoe.nakamura@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/10.jpg	seeker	Yoga instructor and new believer learning to blend mindfulness with prayer.	\N	Los Angeles, CA	Non-denominational	\N	{Hiking,Reading,Worship,Cooking}	2026-02-17 01:51:27.063724+00	2026-02-17 01:51:27.063724+00	CA	Los Angeles	\N	t	5	t	\N	0	0.00	0
38	Ethan Cooper	ethan.cooper@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/3.jpg	seeker	Software engineer exploring faith after years away from church.	\N	Austin, TX	Methodist	\N	{Reading,Photography,Hiking,Music}	2026-02-17 01:51:27.163728+00	2026-02-17 01:51:27.163728+00	TX	Austin	\N	t	5	t	\N	0	0.00	0
39	Destiny Harris	destiny.harris@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩‍🦱	https://randomuser.me/api/portraits/women/57.jpg	seeker	Single mom building a strong spiritual foundation for my family.	\N	Detroit, MI	Pentecostal	\N	{Cooking,Music,"Bible Study","Community Service"}	2026-02-17 01:51:27.250535+00	2026-02-17 01:51:27.250535+00	MI	Detroit	\N	t	5	t	\N	0	0.00	0
40	Liam Fitzgerald	liam.fitzgerald@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/88.jpg	seeker	Seminary student looking for real community outside the classroom.	\N	Boston, MA	Presbyterian	\N	{Reading,Writing,"Bible Study",Travel}	2026-02-17 01:51:27.341224+00	2026-02-17 01:51:27.341224+00	MA	Boston	\N	t	5	t	\N	0	0.00	0
41	Pastor David Okonkwo	pastor.david.okonkwo@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/47.jpg	guide	Energetic evangelist and church planter with a passion for reaching the unchurched.	Evangelism	Charlotte, NC	Pentecostal	\N	{"Community Service",Music,Volunteering,"Bible Study"}	2026-02-17 01:51:27.429867+00	2026-02-17 01:51:27.429867+00	NC	Charlotte	\N	t	6	t	\N	0	0.00	0
42	Jasmine Torres	jasmine.torres@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/65.jpg	seeker	Young professional navigating life and faith in the big city.	\N	Houston, TX	Catholic	\N	{Cooking,Travel,Worship,Volunteering}	2026-02-17 01:51:27.516554+00	2026-02-17 01:51:27.516554+00	TX	Houston	\N	t	5	t	\N	0	0.00	0
43	Ryan Mitchell	ryan.mitchell@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/29.jpg	seeker	Firefighter and new dad looking for a men's group and spiritual accountability.	\N	Minneapolis, MN	Lutheran	\N	{Sports,Hiking,"Community Service","Bible Study"}	2026-02-17 01:51:27.605807+00	2026-02-17 01:51:27.605807+00	MN	Minneapolis	\N	t	5	t	\N	0	0.00	0
44	David Kim	david@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👨	https://randomuser.me/api/portraits/men/79.jpg	seeker	College student exploring my faith journey.	\N	Austin, TX	Non-denominational	Willow Creek Church	{"Bible Study",Worship,Hiking,Music}	2026-02-17 01:51:27.692298+00	2026-02-17 01:51:27.692298+00	TX	Austin	\N	t	5	t	\N	0	0.00	0
45	Maria Santos	maria@sanctuary.com	$2b$10$yxivLURzhcsg.hIo2EWxheU/WZIao0bLE5g5F1hp9nTDaiZ7hYhdW	👩	https://randomuser.me/api/portraits/women/68.jpg	guide	Youth pastor with 10 years of experience in community building.	Youth Ministry	Miami, FL	Catholic	Holy Name Cathedral	{"Youth Ministry",Volunteering,"Community Service",Music}	2026-02-17 01:51:27.775829+00	2026-02-17 01:51:27.775829+00	FL	Miami	\N	f	5	t	\N	0	0.00	0
46	Matthew Markle	mgmarkle1s@gmail.com	$2b$10$YSJGLfGLTcB3gYb0YxM4OuSSWk6GnjQ1bFfKtvTBwM2ezuzD2JC.a	🙏	\N	seeker	\N	\N	Saint louis, MO	Church of Christ	Christ church	{}	2026-02-17 04:16:44.106173+00	2026-02-17 04:18:41.804321+00	MO	Saint louis	\N	t	5	t	6185310183	0	0.00	0
\.


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appointments_id_seq', 4, true);


--
-- Name: bible_quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bible_quotes_id_seq', 21, true);


--
-- Name: church_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.church_accounts_id_seq', 1, true);


--
-- Name: church_announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.church_announcements_id_seq', 4, true);


--
-- Name: church_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.church_favorites_id_seq', 1, false);


--
-- Name: church_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.church_reviews_id_seq', 1, false);


--
-- Name: churches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.churches_id_seq', 5, true);


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversation_participants_id_seq', 22, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversations_id_seq', 12, true);


--
-- Name: event_rsvps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_rsvps_id_seq', 117, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 15, true);


--
-- Name: guide_follows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guide_follows_id_seq', 1, false);


--
-- Name: guide_post_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guide_post_likes_id_seq', 1, false);


--
-- Name: guide_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guide_posts_id_seq', 1, false);


--
-- Name: guide_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guide_reviews_id_seq', 1, false);


--
-- Name: guide_waitlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guide_waitlist_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 67, true);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notes_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 1, false);


--
-- Name: prayer_interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prayer_interactions_id_seq', 73, true);


--
-- Name: prayer_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prayer_requests_id_seq', 14, true);


--
-- Name: reading_plan_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reading_plan_days_id_seq', 59, true);


--
-- Name: reading_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reading_plans_id_seq', 3, true);


--
-- Name: scripture_verses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scripture_verses_id_seq', 81, true);


--
-- Name: user_bible_bookmarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_bible_bookmarks_id_seq', 1, false);


--
-- Name: user_bible_highlights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_bible_highlights_id_seq', 1, false);


--
-- Name: user_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_blocks_id_seq', 1, false);


--
-- Name: user_connections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_connections_id_seq', 47, true);


--
-- Name: user_memorization_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_memorization_stats_id_seq', 1, false);


--
-- Name: user_reading_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_reading_progress_id_seq', 1, false);


--
-- Name: user_study_streaks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_study_streaks_id_seq', 1, false);


--
-- Name: user_verse_bookmarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_verse_bookmarks_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 46, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: bible_quotes bible_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_quotes
    ADD CONSTRAINT bible_quotes_pkey PRIMARY KEY (id);


--
-- Name: church_account_guides church_account_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_account_guides
    ADD CONSTRAINT church_account_guides_pkey PRIMARY KEY (church_account_id, guide_id);


--
-- Name: church_accounts church_accounts_church_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_accounts
    ADD CONSTRAINT church_accounts_church_id_key UNIQUE (church_id);


--
-- Name: church_accounts church_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_accounts
    ADD CONSTRAINT church_accounts_email_key UNIQUE (email);


--
-- Name: church_accounts church_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_accounts
    ADD CONSTRAINT church_accounts_pkey PRIMARY KEY (id);


--
-- Name: church_announcements church_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_announcements
    ADD CONSTRAINT church_announcements_pkey PRIMARY KEY (id);


--
-- Name: church_favorites church_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_favorites
    ADD CONSTRAINT church_favorites_pkey PRIMARY KEY (id);


--
-- Name: church_favorites church_favorites_user_id_church_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_favorites
    ADD CONSTRAINT church_favorites_user_id_church_id_key UNIQUE (user_id, church_id);


--
-- Name: church_reviews church_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_reviews
    ADD CONSTRAINT church_reviews_pkey PRIMARY KEY (id);


--
-- Name: church_reviews church_reviews_user_id_church_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_reviews
    ADD CONSTRAINT church_reviews_user_id_church_id_key UNIQUE (user_id, church_id);


--
-- Name: churches churches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.churches
    ADD CONSTRAINT churches_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: event_rsvps event_rsvps_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_rsvps event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: guide_follows guide_follows_follower_id_guide_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_follows
    ADD CONSTRAINT guide_follows_follower_id_guide_id_key UNIQUE (follower_id, guide_id);


--
-- Name: guide_follows guide_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_follows
    ADD CONSTRAINT guide_follows_pkey PRIMARY KEY (id);


--
-- Name: guide_post_likes guide_post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_post_likes
    ADD CONSTRAINT guide_post_likes_pkey PRIMARY KEY (id);


--
-- Name: guide_post_likes guide_post_likes_user_id_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_post_likes
    ADD CONSTRAINT guide_post_likes_user_id_post_id_key UNIQUE (user_id, post_id);


--
-- Name: guide_posts guide_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_posts
    ADD CONSTRAINT guide_posts_pkey PRIMARY KEY (id);


--
-- Name: guide_reviews guide_reviews_guide_id_seeker_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_reviews
    ADD CONSTRAINT guide_reviews_guide_id_seeker_id_key UNIQUE (guide_id, seeker_id);


--
-- Name: guide_reviews guide_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_reviews
    ADD CONSTRAINT guide_reviews_pkey PRIMARY KEY (id);


--
-- Name: guide_waitlist guide_waitlist_guide_id_seeker_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_waitlist
    ADD CONSTRAINT guide_waitlist_guide_id_seeker_id_key UNIQUE (guide_id, seeker_id);


--
-- Name: guide_waitlist guide_waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_waitlist
    ADD CONSTRAINT guide_waitlist_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: prayer_interactions prayer_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_interactions
    ADD CONSTRAINT prayer_interactions_pkey PRIMARY KEY (id);


--
-- Name: prayer_requests prayer_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_requests
    ADD CONSTRAINT prayer_requests_pkey PRIMARY KEY (id);


--
-- Name: reading_plan_days reading_plan_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_days
    ADD CONSTRAINT reading_plan_days_pkey PRIMARY KEY (id);


--
-- Name: reading_plans reading_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plans
    ADD CONSTRAINT reading_plans_pkey PRIMARY KEY (id);


--
-- Name: scripture_verses scripture_verses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scripture_verses
    ADD CONSTRAINT scripture_verses_pkey PRIMARY KEY (id);


--
-- Name: user_bible_bookmarks user_bible_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_bookmarks
    ADD CONSTRAINT user_bible_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: user_bible_bookmarks user_bible_bookmarks_user_id_book_chapter_verse_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_bookmarks
    ADD CONSTRAINT user_bible_bookmarks_user_id_book_chapter_verse_key UNIQUE (user_id, book, chapter, verse);


--
-- Name: user_bible_highlights user_bible_highlights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_highlights
    ADD CONSTRAINT user_bible_highlights_pkey PRIMARY KEY (id);


--
-- Name: user_bible_highlights user_bible_highlights_user_id_book_chapter_verse_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_highlights
    ADD CONSTRAINT user_bible_highlights_user_id_book_chapter_verse_key UNIQUE (user_id, book, chapter, verse);


--
-- Name: user_blocks user_blocks_blocker_id_blocked_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocker_id_blocked_id_key UNIQUE (blocker_id, blocked_id);


--
-- Name: user_blocks user_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_pkey PRIMARY KEY (id);


--
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (id);


--
-- Name: user_connections user_connections_requester_id_recipient_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_requester_id_recipient_id_key UNIQUE (requester_id, recipient_id);


--
-- Name: user_memorization_stats user_memorization_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memorization_stats
    ADD CONSTRAINT user_memorization_stats_pkey PRIMARY KEY (id);


--
-- Name: user_memorization_stats user_memorization_stats_user_id_verse_id_mode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memorization_stats
    ADD CONSTRAINT user_memorization_stats_user_id_verse_id_mode_key UNIQUE (user_id, verse_id, mode);


--
-- Name: user_reading_progress user_reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reading_progress
    ADD CONSTRAINT user_reading_progress_pkey PRIMARY KEY (id);


--
-- Name: user_reading_progress user_reading_progress_user_id_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reading_progress
    ADD CONSTRAINT user_reading_progress_user_id_plan_id_key UNIQUE (user_id, plan_id);


--
-- Name: user_study_streaks user_study_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_study_streaks
    ADD CONSTRAINT user_study_streaks_pkey PRIMARY KEY (id);


--
-- Name: user_study_streaks user_study_streaks_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_study_streaks
    ADD CONSTRAINT user_study_streaks_user_id_key UNIQUE (user_id);


--
-- Name: user_verse_bookmarks user_verse_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verse_bookmarks
    ADD CONSTRAINT user_verse_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: user_verse_bookmarks user_verse_bookmarks_user_id_verse_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verse_bookmarks
    ADD CONSTRAINT user_verse_bookmarks_user_id_verse_id_key UNIQUE (user_id, verse_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_announcements_church; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_church ON public.church_announcements USING btree (church_id);


--
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (date);


--
-- Name: idx_appointments_guide; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_guide ON public.appointments USING btree (guide_id);


--
-- Name: idx_appointments_seeker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_seeker ON public.appointments USING btree (seeker_id);


--
-- Name: idx_appointments_series; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_series ON public.appointments USING btree (series_id);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_bible_bookmarks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bible_bookmarks_user ON public.user_bible_bookmarks USING btree (user_id);


--
-- Name: idx_bible_highlights_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bible_highlights_user ON public.user_bible_highlights USING btree (user_id);


--
-- Name: idx_church_accounts_church_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_church_accounts_church_id ON public.church_accounts USING btree (church_id);


--
-- Name: idx_church_accounts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_church_accounts_email ON public.church_accounts USING btree (email);


--
-- Name: idx_church_favorites_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_church_favorites_user ON public.church_favorites USING btree (user_id);


--
-- Name: idx_church_reviews_church; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_church_reviews_church ON public.church_reviews USING btree (church_id);


--
-- Name: idx_church_reviews_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_church_reviews_user ON public.church_reviews USING btree (user_id);


--
-- Name: idx_churches_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_churches_city ON public.churches USING btree (city);


--
-- Name: idx_churches_google_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_churches_google_place_id ON public.churches USING btree (google_place_id) WHERE (google_place_id IS NOT NULL);


--
-- Name: idx_churches_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_churches_state ON public.churches USING btree (state);


--
-- Name: idx_churches_zip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_churches_zip ON public.churches USING btree (zip);


--
-- Name: idx_connections_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_recipient ON public.user_connections USING btree (recipient_id);


--
-- Name: idx_connections_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_requester ON public.user_connections USING btree (requester_id);


--
-- Name: idx_connections_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_status ON public.user_connections USING btree (status);


--
-- Name: idx_conv_participants_conv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_participants_conv ON public.conversation_participants USING btree (conversation_id);


--
-- Name: idx_conv_participants_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_participants_user ON public.conversation_participants USING btree (user_id);


--
-- Name: idx_conversations_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_owner ON public.conversations USING btree (owner_id);


--
-- Name: idx_conversations_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_conversations_pair ON public.conversations USING btree (LEAST(owner_id, person_id), GREATEST(owner_id, person_id));


--
-- Name: idx_conversations_person; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_person ON public.conversations USING btree (person_id);


--
-- Name: idx_event_rsvps_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_rsvps_event ON public.event_rsvps USING btree (event_id);


--
-- Name: idx_event_rsvps_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_rsvps_user ON public.event_rsvps USING btree (user_id);


--
-- Name: idx_events_church; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_church ON public.events USING btree (church_id);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_date ON public.events USING btree (date_time);


--
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_type ON public.events USING btree (event_type);


--
-- Name: idx_guide_follows_follower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_follows_follower ON public.guide_follows USING btree (follower_id);


--
-- Name: idx_guide_follows_guide; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_follows_guide ON public.guide_follows USING btree (guide_id);


--
-- Name: idx_guide_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_posts_created_at ON public.guide_posts USING btree (created_at DESC);


--
-- Name: idx_guide_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_posts_user_id ON public.guide_posts USING btree (user_id);


--
-- Name: idx_guide_reviews_guide; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_reviews_guide ON public.guide_reviews USING btree (guide_id);


--
-- Name: idx_guide_reviews_seeker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_reviews_seeker ON public.guide_reviews USING btree (seeker_id);


--
-- Name: idx_guide_waitlist_guide; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_waitlist_guide ON public.guide_waitlist USING btree (guide_id);


--
-- Name: idx_guide_waitlist_seeker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_waitlist_seeker ON public.guide_waitlist USING btree (seeker_id);


--
-- Name: idx_memo_stats_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memo_stats_user ON public.user_memorization_stats USING btree (user_id);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created ON public.messages USING btree (created_at);


--
-- Name: idx_notes_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_appointment ON public.notes USING btree (appointment_id);


--
-- Name: idx_notes_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_created ON public.notes USING btree (created_at DESC);


--
-- Name: idx_notes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_user ON public.notes USING btree (user_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_password_resets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_resets_user ON public.password_resets USING btree (user_id);


--
-- Name: idx_plan_days_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_days_plan ON public.reading_plan_days USING btree (plan_id);


--
-- Name: idx_prayer_interactions_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prayer_interactions_request ON public.prayer_interactions USING btree (request_id);


--
-- Name: idx_prayer_interactions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prayer_interactions_user ON public.prayer_interactions USING btree (user_id);


--
-- Name: idx_prayer_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prayer_requests_status ON public.prayer_requests USING btree (status);


--
-- Name: idx_prayer_requests_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prayer_requests_user ON public.prayer_requests USING btree (user_id);


--
-- Name: idx_reading_progress_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reading_progress_user ON public.user_reading_progress USING btree (user_id);


--
-- Name: idx_scripture_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scripture_category ON public.scripture_verses USING btree (category);


--
-- Name: idx_user_blocks_blocked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_blocked ON public.user_blocks USING btree (blocked_id);


--
-- Name: idx_user_blocks_blocker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_blocker ON public.user_blocks USING btree (blocker_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_state ON public.users USING btree (state);


--
-- Name: idx_verse_bookmarks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verse_bookmarks_user ON public.user_verse_bookmarks USING btree (user_id);


--
-- Name: appointments appointments_guide_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_seeker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_seeker_id_fkey FOREIGN KEY (seeker_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: church_account_guides church_account_guides_church_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_account_guides
    ADD CONSTRAINT church_account_guides_church_account_id_fkey FOREIGN KEY (church_account_id) REFERENCES public.church_accounts(id) ON DELETE CASCADE;


--
-- Name: church_account_guides church_account_guides_guide_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_account_guides
    ADD CONSTRAINT church_account_guides_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: church_accounts church_accounts_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_accounts
    ADD CONSTRAINT church_accounts_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id);


--
-- Name: church_announcements church_announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_announcements
    ADD CONSTRAINT church_announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: church_announcements church_announcements_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_announcements
    ADD CONSTRAINT church_announcements_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE CASCADE;


--
-- Name: church_favorites church_favorites_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_favorites
    ADD CONSTRAINT church_favorites_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE CASCADE;


--
-- Name: church_favorites church_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_favorites
    ADD CONSTRAINT church_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: church_reviews church_reviews_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_reviews
    ADD CONSTRAINT church_reviews_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE CASCADE;


--
-- Name: church_reviews church_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_reviews
    ADD CONSTRAINT church_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: events events_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: churches fk_churches_featured_plan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.churches
    ADD CONSTRAINT fk_churches_featured_plan FOREIGN KEY (featured_plan_id) REFERENCES public.reading_plans(id) ON DELETE SET NULL;


--
-- Name: churches fk_churches_managed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.churches
    ADD CONSTRAINT fk_churches_managed_by FOREIGN KEY (managed_by) REFERENCES public.church_accounts(id) ON DELETE SET NULL;


--
-- Name: guide_follows fk_guide_follows_follower; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_follows
    ADD CONSTRAINT fk_guide_follows_follower FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guide_follows fk_guide_follows_guide; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_follows
    ADD CONSTRAINT fk_guide_follows_guide FOREIGN KEY (guide_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guide_post_likes fk_guide_post_likes_post; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_post_likes
    ADD CONSTRAINT fk_guide_post_likes_post FOREIGN KEY (post_id) REFERENCES public.guide_posts(id) ON DELETE CASCADE;


--
-- Name: guide_post_likes fk_guide_post_likes_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_post_likes
    ADD CONSTRAINT fk_guide_post_likes_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guide_posts fk_guide_posts_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_posts
    ADD CONSTRAINT fk_guide_posts_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guide_reviews fk_guide_reviews_appointment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_reviews
    ADD CONSTRAINT fk_guide_reviews_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: guide_reviews fk_guide_reviews_guide; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_reviews
    ADD CONSTRAINT fk_guide_reviews_guide FOREIGN KEY (guide_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guide_reviews fk_guide_reviews_seeker; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_reviews
    ADD CONSTRAINT fk_guide_reviews_seeker FOREIGN KEY (seeker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reading_plans fk_reading_plans_church_account; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plans
    ADD CONSTRAINT fk_reading_plans_church_account FOREIGN KEY (church_account_id) REFERENCES public.church_accounts(id) ON DELETE SET NULL;


--
-- Name: users fk_users_preferred_church; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_preferred_church FOREIGN KEY (preferred_church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: guide_waitlist guide_waitlist_guide_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_waitlist
    ADD CONSTRAINT guide_waitlist_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guide_waitlist guide_waitlist_seeker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_waitlist
    ADD CONSTRAINT guide_waitlist_seeker_id_fkey FOREIGN KEY (seeker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: prayer_interactions prayer_interactions_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_interactions
    ADD CONSTRAINT prayer_interactions_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.prayer_requests(id) ON DELETE CASCADE;


--
-- Name: prayer_interactions prayer_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_interactions
    ADD CONSTRAINT prayer_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: prayer_requests prayer_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_requests
    ADD CONSTRAINT prayer_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reading_plan_days reading_plan_days_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_days
    ADD CONSTRAINT reading_plan_days_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.reading_plans(id) ON DELETE CASCADE;


--
-- Name: user_bible_bookmarks user_bible_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_bookmarks
    ADD CONSTRAINT user_bible_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_bible_highlights user_bible_highlights_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bible_highlights
    ADD CONSTRAINT user_bible_highlights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_memorization_stats user_memorization_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memorization_stats
    ADD CONSTRAINT user_memorization_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_memorization_stats user_memorization_stats_verse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memorization_stats
    ADD CONSTRAINT user_memorization_stats_verse_id_fkey FOREIGN KEY (verse_id) REFERENCES public.scripture_verses(id) ON DELETE CASCADE;


--
-- Name: user_reading_progress user_reading_progress_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reading_progress
    ADD CONSTRAINT user_reading_progress_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.reading_plans(id) ON DELETE CASCADE;


--
-- Name: user_reading_progress user_reading_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reading_progress
    ADD CONSTRAINT user_reading_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_study_streaks user_study_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_study_streaks
    ADD CONSTRAINT user_study_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_verse_bookmarks user_verse_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verse_bookmarks
    ADD CONSTRAINT user_verse_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_verse_bookmarks user_verse_bookmarks_verse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verse_bookmarks
    ADD CONSTRAINT user_verse_bookmarks_verse_id_fkey FOREIGN KEY (verse_id) REFERENCES public.scripture_verses(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict sscKd9UXOIvOe2DsrAhPd8RAX4bvemjlXv100V6rn9ErtX4Lh6BAaweaFyreoAm

