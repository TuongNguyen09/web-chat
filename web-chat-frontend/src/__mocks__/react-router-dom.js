const navigate = jest.fn();

module.exports = {
  useNavigate: () => navigate,
  // Basic stubs for components/hooks that may be used elsewhere
  Navigate: () => null,
  MemoryRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Link: ({ children }) => children,
  useParams: jest.fn(() => ({})),
  useLocation: jest.fn(() => ({ pathname: "/" })),
};
