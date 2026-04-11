import React, { useEffect, useState } from 'react';
import {
  Activity,
  BookOpenText,
  CalendarClock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Shield,
  Star,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StatisticsChart from './components/StatisticsChart';

interface OverviewData {
  date: string;
  signUps: number;
  questions: number;
  reviews: number;
}

type DataItem = {
  created_at: string;
};

type ActivityDoctor = {
  id: string;
  name: string;
  profile_picture: string;
  created_at: string;
};

type ActivityPatient = {
  id: string;
  user_id: string;
  username: string;
  name: string;
  profile_picture: string;
  created_at: string;
};

type ActivityArticle = {
  id: string;
  title: string;
  created_at: string;
};

type ActivityReview = {
  id: string;
  review_text: string;
  rating: string;
  created_at: string;
};

type ActivityQuestion = {
  id: string;
  question: string;
  created_at: string;
};

interface ActivityCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  time: string;
  image?: string;
  rating?: number;
}

const Overview = () => {
  const [summary, setSummary] = useState({
    admins: 0,
    doctors: 0,
    patients: 0,
    questions: 0,
    reviews: 0,
    healthArticles: 0,
  });

  const [overviewData, setOverviewData] = useState<OverviewData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activity, setActivity] = useState({
    doctors: [] as ActivityDoctor[],
    patients: [] as ActivityPatient[],
    articles: [] as ActivityArticle[],
    reviews: [] as ActivityReview[],
    questions: [] as ActivityQuestion[],
  });

  const sectionLinks = [
    { id: 'overview-cards', label: 'Overview', icon: LayoutDashboard },
    { id: 'recent-activity', label: 'Recent Activity', icon: Activity },
    { id: 'engagement-trends', label: 'Engagement Trends', icon: Activity },
  ];

  const metricCards = [
    {
      key: 'admins',
      label: 'Admins',
      value: summary.admins,
      icon: Shield,
      tone: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      iconTone: 'bg-cyan-700 text-white',
    },
    {
      key: 'therapists',
      label: 'Therapists',
      value: summary.doctors,
      icon: UserPlus,
      tone: 'bg-blue-100 text-blue-800 border-blue-200',
      iconTone: 'bg-blue-700 text-white',
    },
    {
      key: 'patients',
      label: 'Patients',
      value: summary.patients,
      icon: Users,
      tone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconTone: 'bg-emerald-700 text-white',
    },
    {
      key: 'questions',
      label: 'Questions',
      value: summary.questions,
      icon: HelpCircle,
      tone: 'bg-violet-100 text-violet-800 border-violet-200',
      iconTone: 'bg-violet-700 text-white',
    },
    {
      key: 'reviews',
      label: 'Reviews',
      value: summary.reviews,
      icon: Star,
      tone: 'bg-amber-100 text-amber-800 border-amber-200',
      iconTone: 'bg-amber-600 text-white',
    },
    {
      key: 'articles',
      label: 'Articles',
      value: summary.healthArticles,
      icon: BookOpenText,
      tone: 'bg-rose-100 text-rose-800 border-rose-200',
      iconTone: 'bg-rose-700 text-white',
    },
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);

      try {
        const [
          { count: adminCount },
          { count: doctorCount },
          { count: patientCount },
          { count: questionCount },
          { count: reviewCount },
          { count: articleCount },
          { data: doctors },
          { data: patients },
          { data: articles },
          { data: reviewsActivity },
          { data: questionsActivity },
          { data: userSignUps },
          { data: doctorSignUps },
          { data: questionsTrend },
          { data: reviewsTrend },
          { data: adminUsers },
          { data: doctorUsers },
        ] = await Promise.all([
          supabase.from('admins').select('id', { count: 'exact' }),
          supabase.from('doctors').select('id', { count: 'exact' }),
          supabase.from('user_profiles').select('id', { count: 'exact' }),
          supabase.from('questions').select('id', { count: 'exact' }),
          supabase.from('reviews').select('id', { count: 'exact' }),
          supabase.from('health_articles').select('id', { count: 'exact' }),
          supabase.from('doctors').select('id, name, profile_picture, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('user_profiles').select('id, user_id, username, name, profile_picture, created_at').order('created_at', { ascending: false }).limit(100),
          supabase.from('health_articles').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('reviews').select('id, review_text, rating, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('questions').select('id, question, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('user_profiles').select('created_at').order('created_at', { ascending: true }),
          supabase.from('doctors').select('created_at').order('created_at', { ascending: true }),
          supabase.from('questions').select('created_at').order('created_at', { ascending: true }),
          supabase.from('reviews').select('created_at').order('created_at', { ascending: true }),
          supabase.from('admins').select('user_id'),
          supabase.from('doctors').select('user_id'),
        ]);

        setSummary({
          admins: adminCount || 0,
          doctors: doctorCount || 0,
          patients: patientCount || 0,
          questions: questionCount || 0,
          reviews: reviewCount || 0,
          healthArticles: articleCount || 0,
        });

        const excludedUserIds = new Set<string>([
          ...(adminUsers || []).map((row) => row.user_id).filter(Boolean),
          ...(doctorUsers || []).map((row) => row.user_id).filter(Boolean),
        ]);

        const filteredPatients = (patients || [])
          .filter((patient) => patient.user_id && !excludedUserIds.has(patient.user_id))
          .slice(0, 5);

        setActivity({
          doctors: doctors || [],
          patients: filteredPatients,
          articles: articles || [],
          reviews: reviewsActivity || [],
          questions: questionsActivity || [],
        });

        const aggregateData = (items: DataItem[]) => {
          const aggregated: { [key: string]: number } = {};

          items.forEach((item) => {
            const date = item.created_at.split('T')[0];
            aggregated[date] = (aggregated[date] || 0) + 1;
          });

          return aggregated;
        };

        const userSignUpsData = userSignUps ? aggregateData(userSignUps as DataItem[]) : {};
        const doctorSignUpsData = doctorSignUps ? aggregateData(doctorSignUps as DataItem[]) : {};
        const questionsData = questionsTrend ? aggregateData(questionsTrend as DataItem[]) : {};
        const reviewsData = reviewsTrend ? aggregateData(reviewsTrend as DataItem[]) : {};

        const allDates = [
          ...new Set([
            ...Object.keys(userSignUpsData),
            ...Object.keys(doctorSignUpsData),
            ...Object.keys(questionsData),
            ...Object.keys(reviewsData),
          ]),
        ];

        const trendData = allDates
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .map((date) => ({
            date,
            signUps: (userSignUpsData[date] || 0) + (doctorSignUpsData[date] || 0),
            questions: questionsData[date] || 0,
            reviews: reviewsData[date] || 0,
          }));

        setOverviewData(trendData);
      } catch (error) {
        console.error('Error fetching admin overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-700" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--mh-text)]">Platform Overview</h2>
          <p className="mt-1 text-sm text-[var(--mh-text-muted)]">Track operations, user growth, and engagement trends.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {sectionLinks.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-xs font-semibold text-[var(--mh-text-muted)] transition-colors hover:bg-[var(--mh-surface-soft)]"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </a>
        ))}
      </div>

      <section id="overview-cards" className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((card) => (
            <article
              key={card.key}
              className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold leading-tight">{card.value}</p>
                </div>
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.iconTone}`}>
                  <card.icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="engagement-trends" className="mt-8">
        <div className="rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface)] p-6 shadow-sm">
          <h3 className="text-xl font-bold text-[var(--mh-text)]">Engagement Trends</h3>
          <p className="mt-1 text-sm text-[var(--mh-text-muted)]">
            Compare daily sign-ups, user questions, and review activity over time.
          </p>
          <StatisticsChart data={overviewData} />
        </div>
      </section>

      <section id="recent-activity" className="mt-8">
        <div className="rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-[var(--mh-text)]">Recent Activity</h3>
              <p className="mt-1 text-sm text-[var(--mh-text-muted)]">A live pulse of therapist, patient, content, and support interactions.</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
              Updated in real time
            </span>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <ActivityFeedBlock
              title="New Therapists"
              icon={<UserPlus className="h-5 w-5 text-cyan-700" />}
              tone="border-cyan-200"
              count={activity.doctors.length}
              items={activity.doctors.map((doctor) => (
                <ActivityCard
                  key={doctor.id}
                  icon={<User className="h-5 w-5 text-cyan-700" />}
                  title={doctor.name}
                  subtitle="Therapist profile created"
                  time={doctor.created_at}
                  image={doctor.profile_picture}
                />
              ))}
            />

            <ActivityFeedBlock
              title="New Patients"
              icon={<UserCheck className="h-5 w-5 text-emerald-700" />}
              tone="border-emerald-200"
              count={activity.patients.length}
              items={activity.patients.map((patient) => (
                <ActivityCard
                  key={patient.id}
                  icon={<User className="h-5 w-5 text-emerald-700" />}
                  title={`${patient.name} (${patient.username})`}
                  subtitle="Patient account registered"
                  time={patient.created_at}
                  image={patient.profile_picture}
                />
              ))}
            />

            <ActivityFeedBlock
              title="Health Articles"
              icon={<FileText className="h-5 w-5 text-violet-700" />}
              tone="border-violet-200"
              count={activity.articles.length}
              items={activity.articles.map((article) => (
                <ActivityCard
                  key={article.id}
                  icon={<FileText className="h-5 w-5 text-violet-700" />}
                  title={article.title}
                  subtitle="Article published"
                  time={article.created_at}
                />
              ))}
            />

            <ActivityFeedBlock
              title="Latest Reviews"
              icon={<Star className="h-5 w-5 text-amber-600" />}
              tone="border-amber-200"
              count={activity.reviews.length}
              items={activity.reviews.map((review) => (
                <ActivityCard
                  key={review.id}
                  icon={<Star className="h-5 w-5 text-amber-600" />}
                  title="New user review"
                  subtitle={review.review_text}
                  time={review.created_at}
                  rating={Number(review.rating)}
                />
              ))}
            />

            <div className="xl:col-span-2">
              <ActivityFeedBlock
                title="New Questions"
                icon={<MessageCircle className="h-5 w-5 text-rose-700" />}
                tone="border-rose-200"
                count={activity.questions.length}
                items={activity.questions.map((question) => (
                  <ActivityCard
                    key={question.id}
                    icon={<MessageCircle className="h-5 w-5 text-rose-700" />}
                    title="Incoming question"
                    subtitle={question.question}
                    time={question.created_at}
                  />
                ))}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ActivityFeedBlock = ({
  title,
  icon,
  items,
  tone,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
  tone: string;
  count: number;
}) => {
  return (
    <div className={`rounded-xl border bg-[var(--mh-surface-soft)] p-4 ${tone}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-lg font-semibold text-[var(--mh-text)]">{title}</h4>
        </div>
        <span className="rounded-full border border-[var(--mh-border)] bg-[var(--mh-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--mh-text-muted)]">
          {count}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">{items}</div>
    </div>
  );
};

const ActivityCard: React.FC<ActivityCardProps> = ({ icon, title, subtitle, time, image, rating }) => {
  return (
    <article className="rounded-xl border border-[var(--mh-border)] bg-[var(--mh-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start gap-3">
        {image ? (
          <img src={image} alt="Profile" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--mh-border)] bg-[var(--mh-surface)]">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h5 className="truncate text-sm font-semibold text-[var(--mh-text)]">{title}</h5>
          <p className="mt-1 text-sm text-[var(--mh-text-muted)]">{subtitle}</p>

          {rating ? (
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: Math.max(1, Math.min(5, rating)) }, (_, index) => (
                <Star key={index} className="h-4 w-4 fill-current text-amber-500" />
              ))}
            </div>
          ) : null}

          <p className="mt-2 flex items-center text-xs text-[var(--mh-text-muted)]">
            <CalendarClock className="mr-1 h-3.5 w-3.5" />
            {new Date(time).toLocaleString()}
          </p>
        </div>
      </div>
    </article>
  );
};

export default Overview;


