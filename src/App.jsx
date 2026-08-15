import React, { useEffect, useState } from "react";
import { GraduationCap, Home as HomeIcon, MessageCircle, Sparkles, User, Clapperboard } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { BottomNav, NovaOrb, TopBar } from "./components/ui.jsx";
import AuthFlow, { CompleteProfileScreen } from "./screens/AuthScreens.jsx";
import HomeScreenReal from "./screens/HomeScreen.jsx";
import SearchScreen from "./screens/SearchScreen.jsx";
import RequestsScreen from "./screens/RequestsScreen.jsx";
import { ChatListScreen, ChatRoomScreen } from "./screens/ChatScreens.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import { AiScreen, StudyScreen, WatchScreen } from "./screens/PlaceholderScreens.jsx";
import { listenFriends, listenIncomingRequests, listenOutgoingRequests } from "./lib/friends.js";
import { listenUserChats } from "./lib/chat.js";

const TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "watch", label: "Watch", icon: Clapperboard },
  { id: "study", label: "Study", icon: GraduationCap },
  { id: "ai", label: "Nova", icon: Sparkles },
  { id: "profile", label: "Profile", icon: User },
];

const TITLES = { chat: "Chats", watch: "Watch Together", study: "Study", ai: "Nova", profile: "Profile" };

function MainApp({ user, profile, onLogOut }) {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null);
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  useEffect(() => listenFriends(user.uid, setFriends), [user.uid]);
  useEffect(() => listenUserChats(user.uid, setChats), [user.uid]);
  useEffect(() => listenIncomingRequests(user.uid, setIncoming), [user.uid]);
  useEffect(() => listenOutgoingRequests(user.uid, setOutgoing), [user.uid]);

  function openChat(friend) {
    setOverlay({ type: "chatroom", friend });
  }

  if (overlay === "search") {
    return (
      <SearchScreen
        myUid={user.uid}
        friends={friends}
        incomingRequests={incoming}
        outgoingRequests={outgoing}
        onBack={() => setOverlay(null)}
        onOpenChat={openChat}
      />
    );
  }

  if (overlay === "requests") {
    return (
      <RequestsScreen
        myUid={user.uid}
        incomingRequests={incoming}
        outgoingRequests={outgoing}
        onBack={() => setOverlay(null)}
      />
    );
  }

  if (overlay?.type === "chatroom") {
    return <ChatRoomScreen myUid={user.uid} friend={overlay.friend} onBack={() => setOverlay(null)} />;
  }

  return (
    <>
      <TopBar tab={tab} title={TITLES[tab]} profile={profile} onSearch={() => setOverlay("search")} onBell={() => setOverlay("requests")} bellCount={incoming.length} />
      <main className="halo-main" key={tab}>
        {tab === "home" && (
          <HomeScreenReal
            profile={profile}
            uid={user.uid}
            friends={friends}
            chats={chats}
            pendingCount={incoming.length}
            goTab={setTab}
            onOpenChat={openChat}
            onOpenSearch={() => setOverlay("search")}
          />
        )}
        {tab === "chat" && (
          <ChatListScreen myUid={user.uid} friends={friends} chats={chats} onOpenChat={openChat} onOpenSearch={() => setOverlay("search")} />
        )}
        {tab === "watch" && <WatchScreen />}
        {tab === "study" && <StudyScreen />}
        {tab === "ai" && <AiScreen />}
        {tab === "profile" && (
          <ProfileScreen profile={profile} friendsCount={friends.length} chatsCount={chats.length} onLogOut={onLogOut} />
        )}
      </main>
      <BottomNav tabs={TABS} active={tab} onChange={setTab} />
    </>
  );
}

function Shell() {
  const { user, profile, loading, logOut } = useAuth();

  let content;
  if (loading) {
    content = (
      <div className="halo-splash">
        <NovaOrb size={72} />
      </div>
    );
  } else if (!user) {
    content = <AuthFlow />;
  } else if (!profile) {
    content = <CompleteProfileScreen user={user} />;
  } else {
    content = <MainApp user={user} profile={profile} onLogOut={logOut} />;
  }

  return (
    <div className="halo-root">
      <div className="halo-phone">{content}</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
