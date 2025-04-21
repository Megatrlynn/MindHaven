import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; 
import { CalendarClock, MessageCircle, Star, User, FileText, Loader2, MenuIcon, Home, Users, LayoutDashboard, Clock, UserPlus, UserCheck, BookOpenText, HelpCircle, Activity, XIcon } from "lucide-react";
import StatisticsChart from './components/StatisticsChart';

interface ActivityCardProps {
    icon?: React.ReactNode;
    title: string;
    subtitle: string;
    rating: string;
    time: string | Date;
    image?: string;
  }

interface OverviewData {
     date: string;
     signUps: number;
     questions: number;
     reviews: number;
}

type DataItem = {
    created_at: string;
};

const Overview = () => {
  const [data, setData] = useState({
    admins: 0,
    doctors: 0,
    patients: 0,
    questions: 0,
    reviews: 0,
    healthArticles: 0,
  });

  const [overviewData, setOverviewData] = useState<OverviewData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const [activity, setActivity] = useState({
    doctorz: [] as { id: string; name: string; profile_picture: string; created_at: string }[], 
    patientz: [] as { id: string; username: string; name: string; profile_picture: string; created_at: string }[],
    articlez: [] as { id: string; title: string; created_at: string }[],
    reviewz: [] as { id: string; review_text: string; rating: string; created_at: string }[],
    questionz: [] as { id: string; question: string; created_at: string }[],
  });

  const navItems = [
    { id: 'quick-overview', label: 'Quick Overview', icon: LayoutDashboard },
    { id: 'recent-activity', label: 'Recent Activity', icon: Clock },
    { id: 'new-therapists', label: 'New Therapists', icon: UserPlus },
    { id: 'new-patients', label: 'New Patients', icon: UserCheck },
    { id: 'health-articles', label: 'Health Articles', icon: BookOpenText },
    { id: 'latest-reviews', label: 'Latest Reviews', icon: Star },
    { id: 'new-questions', label: 'New Questions', icon: HelpCircle },
    { id: 'engagement-trends', label: 'Engagement Trends', icon: Activity }
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {

    setLoading(true);

    const fetchData = async () => {
      try {
        const { count: adminCount } = await supabase
            .from('admins')
            .select('id', { count: 'exact' });

        const { count: doctorCount } = await supabase
          .from('doctors')
          .select('id', { count: 'exact' });

        const { count: patientCount } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact' });

        const { count: questionCount } = await supabase
          .from('questions')
          .select('id', { count: 'exact' });

        const { count: reviewCount } = await supabase
          .from('reviews')
          .select('id', { count: 'exact' });

        const { count: healthArticleCount } = await supabase
          .from('health_articles')
          .select('id', { count: 'exact' });

        setData({
            admins: adminCount || 0,
            doctors: doctorCount || 0,
            patients: patientCount || 0,
            questions: questionCount || 0,
            reviews: reviewCount || 0,
            healthArticles: healthArticleCount || 0,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {

        setLoading(true);

      try {
        const [{ data: doctorz }, { data: patientz }, { data: articlez }, { data: reviewz }, { data: questionz }] =
          await Promise.all([
            supabase.from("doctors").select("id, name, profile_picture, created_at").order("created_at", { ascending: false }).limit(5),
            supabase.from("user_profiles").select("id, username, name, profile_picture, created_at").order("created_at", { ascending: false }).limit(5),
            supabase.from("health_articles").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
            supabase.from("reviews").select("id, review_text, rating, created_at").order("created_at", { ascending: false }).limit(5),
            supabase.from("questions").select("id, question, created_at").order("created_at", { ascending: false }).limit(5),
          ]);

          setActivity({
            doctorz: doctorz ?? [],  
            patientz: patientz ?? [],
            articlez: articlez ?? [],
            reviewz: reviewz ?? [],
            questionz: questionz ?? [],
          });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {

        setLoading(true);

      try {
        const { data: userSignUps } = await supabase
          .from('user_profiles')
          .select('created_at')
          .order('created_at', { ascending: true });

        const { data: doctorSignUps } = await supabase
          .from('doctors')
          .select('created_at')
          .order('created_at', { ascending: true });

        const { data: questions } = await supabase
          .from('questions')
          .select('created_at')
          .order('created_at', { ascending: true });

        const { data: reviews } = await supabase
          .from('reviews')
          .select('created_at')
          .order('created_at', { ascending: true });

        const aggregateData = (data: DataItem[]) => {
            const aggregated: { [key: string]: number } = {}; 
        
            data.forEach((item: DataItem) => {
            const date = item.created_at.split('T')[0];
            if (!aggregated[date]) {
                aggregated[date] = 1;
            } else {
                aggregated[date]++;
            }
            });
        
            return aggregated;
        };

        const userSignUpsData = userSignUps ? aggregateData(userSignUps) : {};
        const doctorSignUpsData = doctorSignUps ? aggregateData(doctorSignUps) : {};
        const questionsData = questions ? aggregateData(questions) : {};
        const reviewsData = reviews ? aggregateData(reviews) : {};

        const allDates = [
          ...new Set([
            ...Object.keys(userSignUpsData),
            ...Object.keys(doctorSignUpsData),
            ...Object.keys(questionsData),
            ...Object.keys(reviewsData),
          ]),
        ];

        const finalData = allDates.map((date) => ({
          date,
          signUps: (userSignUpsData[date] || 0) + (doctorSignUpsData[date] || 0),
          questions: questionsData[date] || 0,
          reviews: reviewsData[date] || 0,
        }));

        setOverviewData(finalData);
      } catch (error) {
        console.error('Error fetching data: ', error);
      } finally {
        setLoading(false); 
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="p-6 w-full">
        <h2 className="text-3xl font-semibold text-gray-800">Platform Overview</h2>
        
        <div className="fixed top-1/2 left-4 transform -translate-y-1/2 z-50">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all relative w-12 h-12 flex items-center justify-center"
          >
            <MenuIcon
              className={`absolute w-6 h-6 transition-all duration-300 transform ${
                isNavOpen ? 'opacity-0 scale-75 rotate-45' : 'opacity-100 scale-100 rotate-0'
              }`}
            />
            <XIcon
              className={`absolute w-6 h-6 transition-all duration-300 transform ${
                isNavOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-45'
              }`}
            />
          </button>
        </div>

        {isNavOpen && (
          <div className="fixed top-1/2 left-[50px] transform -translate-y-1/2 z-40 bg-blue-50 rounded-3xl shadow-xl py-4 px-2 transition-all w-16 hover:w-48 group h-[400px] overflow-hidden space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="flex items-center w-full px-2 py-2 rounded-full hover:bg-blue-100 transition-all"
              >
                <item.icon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="ml-3 text-sm text-gray-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}

        <section id="quick-overview" aria-label="Quick Overview">

          <h2 className="text-2xl font-bold text-gray-900 mt-4">Quick Overview</h2>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 place-items-center">

              {/* Admin Card */}
              <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] mt-2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-white p-6 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-bold text-white">Admins</h3>
                      <p className="text-4xl font-semibold mt-2">{data.admins}</p>
                  </div>
                  <div className="text-6xl opacity-70 transform hover:scale-110 transition-all duration-300 ease-in-out">⚙️</div>
              </div>

              {/* Therapist Card */}
              <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] mt-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-bold text-white">Therapists</h3>
                      <p className="text-4xl font-semibold mt-2">{data.doctors}</p>
                  </div>
                  <div className="text-6xl opacity-70 transform hover:scale-110 transition-all duration-300 ease-in-out">👨‍⚕️</div>
              </div>

              {/* Patient Card */}
              <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] mt-2 bg-gradient-to-r from-green-600 to-green-400 text-white p-6 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-semibold">Patients</h3>
                  <p className="text-4xl font-semibold mt-2">{data.patients}</p>
              </div>
              <div className="text-6xl opacity-70 transform hover:scale-110 transition-all duration-300 ease-in-out">🤒</div>
              </div>

              {/* Questions Card */}
              <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] mt-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white p-6 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-semibold">Questions</h3>
                  <p className="text-4xl font-semibold mt-2">{data.questions}</p>
              </div>
              <div className="text-6xl opacity-70 transform hover:scale-110 transition-all duration-300 ease-in-out">❓</div>
              </div>

              {/* Reviews Card */}
              <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] mt-2 bg-gradient-to-r from-gray-600 to-gray-400 text-white p-6 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-semibold">Reviews</h3>
                  <p className="text-4xl font-semibold mt-2">{data.reviews}</p>
              </div>
              <div className="text-6xl opacity-70 transform hover:scale-110 transition-all duration-300 ease-in-out">⭐</div>
              </div>

              {/* Health Articles Card */}
              <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] mt-2 bg-gradient-to-r from-red-600 to-red-400 text-white p-6 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-semibold">Articles</h3>
                  <p className="text-4xl font-semibold mt-2">{data.healthArticles}</p>
              </div>
              <div className="text-6xl opacity-70 transform hover:scale-110 transition-all duration-300 ease-in-out">📚</div>
              </div>
          </div>

        </section>

        <section id="recent-activity" aria-label="Recent Activity">

          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            
            <div className="grid gap-8">

              <section id="new-therapists" aria-label="New Therapists">
                
                {/* Doctors Section */}
                <div>
                  <h2 className="text-xl font-bold text-blue-700 mb-4">👨‍⚕️ New Therapists</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activity.doctorz.map((doc) => (
                      <ActivityCard key={doc.id} icon={<User className="text-blue-500" />} title={doc.name} subtitle="New Therapist Added" time={doc.created_at} image={doc.profile_picture} rating={''} />
                    ))}
                  </div>
                </div>

              </section>

              <section id="new-patients" aria-label="New Patients">
                
                {/* Patients Section */}
                <div>
                  <h2 className="text-xl font-bold text-green-700 mb-4">🧑‍🤝‍🧑 New Patients</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activity.patientz.map((user) => (
                      <ActivityCard key={user.id} icon={<User className="text-green-500" />} title={`${user.name} (${user.username})`} subtitle="New Patient Joined" time={user.created_at} image={user.profile_picture} rating={''} />
                    ))}
                  </div>
                </div>

              </section>

              <section id="health-articles" aria-label="Health Articles">
                
                {/* Health Articles Section */}
                <div>
                  <h2 className="text-xl font-bold text-purple-700 mb-4">📖 Health Articles</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activity.articlez.map((article) => (
                      <ActivityCard key={article.id} icon={<FileText className="text-purple-500" />} title={article.title} subtitle="New Health Article" time={article.created_at} rating={''} />
                    ))}
                  </div>
                </div>

              </section>

              <section id="latest-reviews" aria-label="Latest Reviews">
                
                {/* Reviews Section */}
                <div>
                  <h2 className="text-xl font-bold text-yellow-700 mb-4">⭐ Latest Reviews</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activity.reviewz.map((review) => (
                      <ActivityCard key={review.id} icon={<Star className="text-yellow-500" />} title="New Review" subtitle={review.review_text} rating={review.rating} time={review.created_at} />
                    ))}
                  </div>
                </div>

              </section>

              <section id="new-questions" aria-label="New Questions">
                
                {/* Questions Section */}
                <div>
                  <h2 className="text-xl font-bold text-red-700 mb-4">❓ New Questions</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activity.questionz.map((question) => (
                      <ActivityCard key={question.id} icon={<MessageCircle className="text-red-500" />} title="New Question" subtitle={question.question} time={question.created_at} rating={''} />
                    ))}
                  </div>
                </div>

              </section>

            </div>
          </div>

        </section>

        <section id="engagement-trends" aria-label="Engagement Trends">

          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Engagement Trends</h1>
              <StatisticsChart data={overviewData} />
          </div>

        </section>
    </div>
  );
};

const ActivityCard: React.FC<ActivityCardProps> = ({ icon, title, subtitle,rating, time, image }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg flex items-center shadow-sm hover:shadow-lg transition mr-3">
      {image ? (
        <img src={image} alt="Profile" className="w-12 h-12 rounded-full mr-4 object-cover" />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md mr-3">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
        <p className="text-sm text-yellow-500 flex">
            {Array.from({ length: Number(rating) }, (_, i) => (
                <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
            ))}
        </p>
        <p className="text-xs text-gray-400 flex items-center mt-2">
          <CalendarClock className="w-4 h-4 mr-1" />
          {new Date(time).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Overview;
