import { useState, useEffect } from 'react';
import { db, logAnalyticsEvent, saveAnalyticsEvent, startTrace, apiBaseUrl } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

const tabs = [
  { id: 'ecommerce', label: 'eCommerce' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'social', label: 'Social Feed' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'lms', label: 'LMS' },
  { id: 'crm', label: 'CRM' },
  { id: 'analytics', label: 'Analytics' }
];

const sectionStyle = { marginTop: '1.5rem', padding: '1rem', background: '#111', borderRadius: '12px' };
const inputStyle = { width: '100%', padding: '10px', marginTop: '10px', background: '#121212', border: '1px solid #333', color: '#fff', borderRadius: '8px' };
const buttonStyle = { padding: '10px 16px', cursor: 'pointer', marginTop: '10px' };

const BusinessSuite = ({ user, role }) => {
  const [activeTab, setActiveTab] = useState('ecommerce');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  const [orderNote, setOrderNote] = useState('');

  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryForm, setInventoryForm] = useState({ name: '', sku: '', stock: '' });

  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState({ patient: '', date: '', notes: '' });

  const [courses, setCourses] = useState([]);
  const [enrolledCourseId, setEnrolledCourseId] = useState('');
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });

  const [leads, setLeads] = useState([]);
  const [leadForm, setLeadForm] = useState({ name: '', company: '', email: '' });

  const [analyticsEvents, setAnalyticsEvents] = useState([]);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const isAdmin = role === 'admin';
  const canManageInventory = ['admin', 'manager'].includes(role);

  const trackEvent = (eventName, params = {}) => {
    logAnalyticsEvent(eventName, params);
    saveAnalyticsEvent(eventName, { ...params, userId: user.uid, role });
  };

  useEffect(() => {
    const sectionTrace = startTrace(`tab_${activeTab}`);
    sectionTrace?.start();
    trackEvent('view_tab', { tab: activeTab });
    return () => sectionTrace?.stop();
  }, [activeTab]);

  useEffect(() => {
    loadAll();
    const loadTrace = startTrace('business_suite_load');
    loadTrace?.start();
    return () => loadTrace?.stop();
  }, []);

  const loadAll = async () => {
    await Promise.all([
      loadProducts(),
      loadInventory(),
      loadPosts(),
      loadAppointments(),
      loadCourses(),
      loadLeads(),
      loadAnalyticsRecords()
    ]);
  };

  const loadProducts = async () => {
    const snapshot = await getDocs(query(collection(db, 'products'), orderBy('name')));
    setProducts(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  };

  const loadInventory = async () => {
    const snapshot = await getDocs(query(collection(db, 'inventory'), orderBy('name')));
    setInventoryItems(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  };

  const loadPosts = async () => {
    const snapshot = await getDocs(query(collection(db, 'socialPosts'), orderBy('createdAt', 'desc')));
    setPosts(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  };

  const loadAppointments = async () => {
    const snapshot = await getDocs(query(collection(db, 'healthAppointments'), orderBy('appointmentDate')));
    setAppointments(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  };

  const loadCourses = async () => {
    const snapshot = await getDocs(query(collection(db, 'courses'), orderBy('title')));
    setCourses(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  };

  const loadLeads = async () => {
    const snapshot = await getDocs(query(collection(db, 'crmLeads'), orderBy('createdAt', 'desc')));
    setLeads(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  };

  const callServerlessApi = async () => {
    setApiLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/hello`);
      const data = await response.json();
      setApiResponse(data);
      trackEvent('serverless_api_call', { status: response.status, url: apiBaseUrl });
    } catch (error) {
      setApiResponse({ error: error.message });
      trackEvent('serverless_api_error', { error: error.message });
    } finally {
      setApiLoading(false);
    }
  };

  const loadAnalyticsRecords = async () => {
    const snapshot = await getDocs(query(collection(db, 'analyticsEvents'), orderBy('createdAt', 'desc')));
    setAnalyticsEvents(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;
    await addDoc(collection(db, 'products'), {
      name: newProduct.name,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      createdAt: serverTimestamp()
    });
    setNewProduct({ name: '', price: '', stock: '' });
    await loadProducts();
    trackEvent('create_product', { name: newProduct.name, role });
  };

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
    trackEvent('add_to_cart', { productId: product.id, name: product.name });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const orderItems = cart.map((item) => ({ productId: item.id, name: item.name, price: item.price, quantity: item.quantity }));
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      email: user.email,
      items: orderItems,
      total,
      note: orderNote,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    setCart([]);
    setOrderNote('');
    trackEvent('place_order', { total, itemCount: orderItems.length });
    alert('Order placed successfully!');
  };

  const addInventoryItem = async () => {
    if (!inventoryForm.name || !inventoryForm.sku || !inventoryForm.stock) return;
    await addDoc(collection(db, 'inventory'), {
      name: inventoryForm.name,
      sku: inventoryForm.sku,
      stock: Number(inventoryForm.stock),
      updatedAt: serverTimestamp()
    });
    setInventoryForm({ name: '', sku: '', stock: '' });
    await loadInventory();
    trackEvent('create_inventory_item', { name: inventoryForm.name });
  };

  const updateInventoryStock = async (item, amount) => {
    const itemDoc = doc(db, 'inventory', item.id);
    await updateDoc(itemDoc, { stock: item.stock + amount, updatedAt: serverTimestamp() });
    await loadInventory();
    trackEvent('update_inventory_stock', { itemId: item.id, amount });
  };

  const deleteInventoryItem = async (itemId) => {
    await deleteDoc(doc(db, 'inventory', itemId));
    await loadInventory();
    trackEvent('delete_inventory_item', { itemId });
  };

  const createPost = async () => {
    if (!postText) return;
    await addDoc(collection(db, 'socialPosts'), {
      text: postText,
      userId: user.uid,
      author: user.email,
      likes: [],
      createdAt: serverTimestamp()
    });
    setPostText('');
    await loadPosts();
    trackEvent('create_post', { textLength: postText.length });
  };

  const toggleLike = async (post) => {
    const postDoc = doc(db, 'socialPosts', post.id);
    const alreadyLiked = post.likes?.includes(user.uid);
    await updateDoc(postDoc, {
      likes: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
    await loadPosts();
    trackEvent('toggle_like', { postId: post.id, liked: !alreadyLiked });
  };

  const scheduleAppointment = async () => {
    if (!appointmentForm.patient || !appointmentForm.date) return;
    await addDoc(collection(db, 'healthAppointments'), {
      patient: appointmentForm.patient,
      appointmentDate: appointmentForm.date,
      notes: appointmentForm.notes,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    setAppointmentForm({ patient: '', date: '', notes: '' });
    await loadAppointments();
    trackEvent('schedule_appointment', { patient: appointmentForm.patient });
  };

  const createCourse = async () => {
    if (!newCourse.title || !newCourse.description) return;
    await addDoc(collection(db, 'courses'), {
      title: newCourse.title,
      description: newCourse.description,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    setNewCourse({ title: '', description: '' });
    await loadCourses();
    trackEvent('create_course', { title: newCourse.title });
  };

  const enrollCourse = async (course) => {
    await addDoc(collection(db, 'enrollments'), {
      userId: user.uid,
      courseId: course.id,
      courseTitle: course.title,
      enrolledAt: serverTimestamp()
    });
    setEnrolledCourseId(course.id);
    trackEvent('enroll_course', { courseId: course.id, title: course.title });
  };

  const createLead = async () => {
    if (!leadForm.name || !leadForm.email) return;
    await addDoc(collection(db, 'crmLeads'), {
      name: leadForm.name,
      company: leadForm.company,
      email: leadForm.email,
      status: 'New',
      createdAt: serverTimestamp()
    });
    setLeadForm({ name: '', company: '', email: '' });
    await loadLeads();
    trackEvent('create_lead', { name: leadForm.name });
  };

  const updateLeadStatus = async (lead, status) => {
    const leadDoc = doc(db, 'crmLeads', lead.id);
    await updateDoc(leadDoc, { status });
    await loadLeads();
    trackEvent('update_lead', { leadId: lead.id, status });
  };

  const renderEcommerce = () => (
    <div style={sectionStyle}>
      <h3>Task 30: eCommerce Backend</h3>
      <p>Products and orders stored in Firestore.</p>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h4>Available Products</h4>
          {products.length === 0 ? <p>No products yet.</p> : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {products.map((product) => (
                <div key={product.id} style={{ padding: '12px', background: '#181818', borderRadius: '8px' }}>
                  <strong>{product.name}</strong>
                  <p>Price: ${product.price} • Stock: {product.stock}</p>
                  <button style={buttonStyle} onClick={() => addToCart(product)}>Add to Cart</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4>Cart</h4>
          {cart.length === 0 ? <p>Your cart is empty.</p> : (
            <div>
              {cart.map((item) => (
                <div key={item.id} style={{ padding: '10px', borderBottom: '1px solid #333' }}>
                  {item.name} x {item.quantity} = ${item.price * item.quantity}
                </div>
              ))}
              <p style={{ marginTop: '10px' }}><strong>Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}</strong></p>
            </div>
          )}
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder='Order note'
            style={{ ...inputStyle, height: '80px' }}
          />
          <button style={buttonStyle} onClick={placeOrder} disabled={cart.length === 0}>Place Order</button>
        </div>

        <div style={{ padding: '12px', background: '#111', borderRadius: '8px' }}>
          <h4>Admin: Add Product</h4>
          <input style={inputStyle} placeholder='Product name' value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
          <input style={inputStyle} placeholder='Price' value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
          <input style={inputStyle} placeholder='Stock' value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
          <button style={buttonStyle} onClick={addProduct}>Add Product</button>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div style={sectionStyle}>
      <h3>Task 31: Inventory Management</h3>
      <p>Track inventory items and manage stock levels.</p>
      <div style={{ marginBottom: '1rem' }}>
        <input style={inputStyle} placeholder='Item name' value={inventoryForm.name} onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })} />
        <input style={inputStyle} placeholder='SKU' value={inventoryForm.sku} onChange={(e) => setInventoryForm({ ...inventoryForm, sku: e.target.value })} />
        <input style={inputStyle} placeholder='Stock' value={inventoryForm.stock} onChange={(e) => setInventoryForm({ ...inventoryForm, stock: e.target.value })} />
        <button style={buttonStyle} onClick={addInventoryItem} disabled={!canManageInventory}>Add Inventory Item</button>
        {!canManageInventory && <p style={{ color: '#f66', marginTop: '10px' }}>Only admin or manager can add and edit inventory.</p>}
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {inventoryItems.map((item) => (
          <div key={item.id} style={{ padding: '12px', background: '#181818', borderRadius: '8px' }}>
            <strong>{item.name}</strong> • SKU: {item.sku}
            <p>Stock: {item.stock}</p>
            <button style={buttonStyle} onClick={() => updateInventoryStock(item, 1)} disabled={!canManageInventory}>+ Stock</button>
            <button style={buttonStyle} onClick={() => updateInventoryStock(item, -1)} disabled={!canManageInventory}>- Stock</button>
            <button style={buttonStyle} onClick={() => deleteInventoryItem(item.id)} disabled={!canManageInventory}>Delete</button>
            {item.stock < 5 && <p style={{ color: '#f4c542' }}>Low stock alert</p>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocial = () => (
    <div style={sectionStyle}>
      <h3>Task 32: Social Media Backend</h3>
      <p>Create and like posts in a Firestore-powered feed.</p>
      <textarea style={{ ...inputStyle, height: '80px' }} placeholder='Write a new post...' value={postText} onChange={(e) => setPostText(e.target.value)} />
      <button style={buttonStyle} onClick={createPost}>Post</button>
      <div style={{ marginTop: '1rem', display: 'grid', gap: '12px' }}>
        {posts.map((post) => (
          <div key={post.id} style={{ padding: '12px', background: '#181818', borderRadius: '8px' }}>
            <div style={{ marginBottom: '6px' }}>{post.author}</div>
            <p>{post.text}</p>
            <button style={buttonStyle} onClick={() => toggleLike(post)}>{post.likes?.includes(user.uid) ? 'Unlike' : 'Like'} ({post.likes?.length || 0})</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHealthcare = () => (
    <div style={sectionStyle}>
      <h3>Task 33: Healthcare Management</h3>
      <p>Schedule appointments and keep patient records.</p>
      <input style={inputStyle} placeholder='Patient name' value={appointmentForm.patient} onChange={(e) => setAppointmentForm({ ...appointmentForm, patient: e.target.value })} />
      <input style={inputStyle} type='date' value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} />
      <textarea style={{ ...inputStyle, height: '80px' }} placeholder='Notes' value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} />
      <button style={buttonStyle} onClick={scheduleAppointment}>Schedule Appointment</button>
      <div style={{ marginTop: '1rem', display: 'grid', gap: '10px' }}>
        {appointments.map((appointment) => (
          <div key={appointment.id} style={{ padding: '12px', background: '#181818', borderRadius: '8px' }}>
            <strong>{appointment.patient}</strong>
            <p>Date: {appointment.appointmentDate}</p>
            <p>{appointment.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLms = () => (
    <div style={sectionStyle}>
      <h3>Task 34: LMS Platform</h3>
      <p>Publish courses and enroll users in learning content.</p>
      <input style={inputStyle} placeholder='Course title' value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
      <textarea style={{ ...inputStyle, height: '80px' }} placeholder='Course description' value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
      <button style={buttonStyle} onClick={createCourse}>Create Course</button>
      <div style={{ marginTop: '1rem', display: 'grid', gap: '12px' }}>
        {courses.map((course) => (
          <div key={course.id} style={{ padding: '12px', background: '#181818', borderRadius: '8px' }}>
            <strong>{course.title}</strong>
            <p>{course.description}</p>
            <button style={buttonStyle} onClick={() => enrollCourse(course)}>Enroll</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCrm = () => (
    <div style={sectionStyle}>
      <h3>Task 35: CRM Application</h3>
      <p>Manage leads and follow-up status in Firestore.</p>
      <input style={inputStyle} placeholder='Lead name' value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} />
      <input style={inputStyle} placeholder='Company' value={leadForm.company} onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })} />
      <input style={inputStyle} placeholder='Email' value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
      <button style={buttonStyle} onClick={createLead} disabled={!isAdmin}>Create Lead</button>
      {!isAdmin && <p style={{ color: '#f66', marginTop: '10px' }}>CRM lead creation is available only to admin users.</p>}
      <div style={{ marginTop: '1rem', display: 'grid', gap: '12px' }}>
        {leads.map((lead) => (
          <div key={lead.id} style={{ padding: '12px', background: '#181818', borderRadius: '8px' }}>
            <strong>{lead.name}</strong> • {lead.company}
            <p>{lead.email}</p>
            <p>Status: {lead.status}</p>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button style={buttonStyle} onClick={() => updateLeadStatus(lead, 'Contacted')}>Contacted</button>
                <button style={buttonStyle} onClick={() => updateLeadStatus(lead, 'Qualified')}>Qualified</button>
                <button style={buttonStyle} onClick={() => updateLeadStatus(lead, 'Closed')}>Closed</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div style={sectionStyle}>
      <h3>Tasks 37–40: Analytics & Performance</h3>
      <p>Firebase Analytics events and performance tracing are enabled.
      Custom actions are stored in Firestore as analytics events.</p>
      <button style={buttonStyle} onClick={() => trackEvent('manual_analytics_test', { label: 'manual_tracking' })}>Log Custom Event</button>
      <button style={{ ...buttonStyle, marginLeft: '10px' }} onClick={callServerlessApi} disabled={apiLoading}>
        {apiLoading ? 'Calling API...' : 'Call Serverless API'}
      </button>
      {apiResponse && (
        <div style={{ marginTop: '1rem', padding: '10px', background: '#111', borderRadius: '8px' }}>
          <h4>API Response</h4>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ccc' }}>{JSON.stringify(apiResponse, null, 2)}</pre>
        </div>
      )}
      <div style={{ marginTop: '1rem' }}>
        <h4>Recent Analytics Events</h4>
        {analyticsEvents.length === 0 ? <p>No analytics events stored yet.</p> : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {analyticsEvents.slice(0, 10).map((event) => (
              <div key={event.id} style={{ padding: '10px', background: '#181818', borderRadius: '8px' }}>
                <div><strong>{event.eventName}</strong></div>
                <div style={{ fontSize: '0.9rem', color: '#bbb' }}>{new Date(event.createdAt).toLocaleString()}</div>
                <pre style={{ whiteSpace: 'pre-wrap', color: '#ccc' }}>{JSON.stringify(event.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'ecommerce': return renderEcommerce();
      case 'inventory': return renderInventory();
      case 'social': return renderSocial();
      case 'healthcare': return renderHealthcare();
      case 'lms': return renderLms();
      case 'crm': return renderCrm();
      case 'analytics': return renderAnalytics();
      default: return null;
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...buttonStyle,
              background: activeTab === tab.id ? '#4CAF50' : '#222',
              color: activeTab === tab.id ? '#111' : '#fff'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};

export default BusinessSuite;
